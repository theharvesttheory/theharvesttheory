import importlib.util
from pathlib import Path
import socket
import pytest

ROOT=Path(__file__).resolve().parents[2]
def launcher():
    spec=importlib.util.spec_from_file_location('local_harness',ROOT/'scripts/run-local.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def test_occupied_port_reports_without_killing_owner():
    mod=launcher()
    with socket.socket() as listener:
        listener.bind(('127.0.0.1',0));listener.listen()
        with pytest.raises(RuntimeError,match='occupied'):mod.ensure_ports_free([listener.getsockname()[1]])
        assert listener.fileno()>0

def test_loopback_database_and_simulator_guards():
    mod=launcher()
    for url in ('mongodb+srv://production.example.test/db','mongodb://user:secret@127.0.0.1:27017','mongodb://db.example.test:27017'):
        with pytest.raises(ValueError):mod.validate_mongo_url(url)
    assert mod.validate_mongo_url('mongodb://127.0.0.1:27017')
    from support.provider_server import validate_bind
    with pytest.raises(ValueError):validate_bind('0.0.0.0')

def test_missing_mongo_fails_before_starting_children():
    mod=launcher()
    with socket.socket() as unused:
        unused.bind(('127.0.0.1',0));port=unused.getsockname()[1]
    with pytest.raises(RuntimeError,match='Mongo'):mod.check_mongo(f'mongodb://127.0.0.1:{port}')

def test_stop_refuses_unowned_or_reused_process(monkeypatch):
    mod=launcher();calls=[]
    monkeypatch.setattr(mod,'process_command',lambda pid:'unrelated service')
    monkeypatch.setattr(mod.os,'kill',lambda *args:calls.append(args))
    with pytest.raises(RuntimeError,match='ownership'):mod.stop_owned({'supervisor_pid':123,'token':'synthetic-token'})
    assert calls==[]
