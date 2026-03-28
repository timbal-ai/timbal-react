import { TimbalRuntimeProvider, type TimbalRuntimeProviderProps } from "../runtime/provider";
import { Thread, type ThreadProps } from "./thread";

export interface TimbalChatProps
  extends Omit<TimbalRuntimeProviderProps, "children">,
    ThreadProps {}

export function TimbalChat({
  workforceId,
  baseUrl,
  fetch,
  ...threadProps
}: TimbalChatProps) {
  return (
    <TimbalRuntimeProvider workforceId={workforceId} baseUrl={baseUrl} fetch={fetch}>
      <Thread {...threadProps} />
    </TimbalRuntimeProvider>
  );
}
