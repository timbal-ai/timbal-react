/**
 * @deprecated Radix/shadcn `Tabs` was removed. Use the Timbal pill segmented control:
 *
 * - Dashboard section bars → `SubNav` from `@timbal-ai/timbal-react/app`
 * - Same look in `/ui` → `PillSegmentedTabs` (`trackVariant="flush"` for Overview/Reports chrome)
 *
 * Switch panel content with local state (or the router), not `TabsContent`.
 */
export {
  PillSegmentedTabs,
  MemoPillSegmentedTabs,
  type PillSegmentedTab,
  type PillSegmentedTabsProps,
} from "./pill-segmented-tabs";
