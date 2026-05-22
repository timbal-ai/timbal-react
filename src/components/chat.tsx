import { TimbalRuntimeProvider, type TimbalRuntimeProviderProps } from "../runtime/provider";
import { Thread, type ThreadProps } from "./thread";

export interface TimbalChatProps
  extends Omit<TimbalRuntimeProviderProps, "children">,
    ThreadProps {}

export function TimbalChat({
  workforceId,
  baseUrl,
  fetch,
  attachments,
  attachmentsUploadUrl,
  attachmentsAccept,
  debug,
  ...threadProps
}: TimbalChatProps) {
  return (
    <TimbalRuntimeProvider
      workforceId={workforceId}
      baseUrl={baseUrl}
      fetch={fetch}
      attachments={attachments}
      attachmentsUploadUrl={attachmentsUploadUrl}
      attachmentsAccept={attachmentsAccept}
      debug={debug}
    >
      <Thread {...threadProps} />
    </TimbalRuntimeProvider>
  );
}
