import contract from "@/data/intake-contract.json";
import { Page } from '@/components/Reveal';
import { launch, privacySections } from '@/data/privacy';
export default function Privacy(){
 return <Page className="limewash"><article className="mx-auto max-w-3xl px-6 pb-28 pt-40">
  <p className="eyebrow">The Harvest Theory</p><h1 className="mt-6 font-display text-5xl text-ink">Privacy Policy</h1>
  {(!launch.privacyApproved||!launch.retentionApproved)&&<p className="mt-6 border border-gold p-4 text-sm">Draft for owner review. Business identity, contact, retention and provider configuration must be confirmed before publication.</p>}
  <p className="mt-6 text-sm text-ink/75">Notice version: {contract.version}</p>
  {launch.ownerName&&<p className="mt-4">{launch.ownerName}{launch.ownerAddress&&` · ${launch.ownerAddress}`}</p>}
  {privacySections.map(section=><section key={section.title} className="mt-10"><h2 className="font-display text-2xl text-ink">{section.title}</h2><p className="mt-4 leading-relaxed text-ink/80">{section.text}</p></section>)}
 </article></Page>;
}
