"use client";

import { type FC, type ReactNode } from "react";
import { motion } from "motion/react";
import { useThread } from "@assistant-ui/react";

import type { ThreadWelcomeProps } from "../thread";
import { TimbalMark } from "./timbal-mark";

const luxuryEase = [0.16, 1, 0.3, 1] as const;

const welcomeStagger = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.16, delayChildren: 0.18 },
  },
};

const welcomeItem = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: luxuryEase },
  },
};

const welcomeIcon = {
  initial: { opacity: 0, y: 10, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.1, ease: luxuryEase },
  },
};

export interface StudioWelcomeProps extends ThreadWelcomeProps {
  /** Override the brand mark rendered above the heading. */
  icon?: ReactNode;
}

/**
 * Welcome screen with the staggered Timbal mark + heading + subheading.
 * Drop in as the `components.Welcome` slot of `<Thread />` /
 * `<TimbalChat />` to replace the default sparkle illustration.
 */
export const StudioWelcome: FC<StudioWelcomeProps> = ({ config, icon }) => {
  const isEmpty = useThread((s) => s.messages.length === 0);
  if (!isEmpty) return null;

  const iconNode = icon ?? (
    <TimbalMark
      size={112}
      className="max-md:scale-[0.58] max-md:origin-center"
    />
  );

  return (
    <div className="aui-thread-welcome-root mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
      <div className="aui-thread-welcome-center flex w-full grow flex-col items-center justify-center">
        <motion.div
          className="aui-thread-welcome-message flex flex-col items-center justify-center px-2 text-center sm:px-4"
          variants={welcomeStagger}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={welcomeIcon} className="mb-4 md:mb-5">
            {iconNode}
          </motion.div>
          <motion.h1
            variants={welcomeItem}
            className="aui-thread-welcome-message-inner text-xl font-semibold sm:text-2xl"
          >
            {config?.heading ?? "How can I help you today?"}
          </motion.h1>
          <motion.p
            variants={welcomeItem}
            className="aui-thread-welcome-message-inner mt-2 text-muted-foreground"
          >
            {config?.subheading ?? "Send a message to start a conversation."}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};
