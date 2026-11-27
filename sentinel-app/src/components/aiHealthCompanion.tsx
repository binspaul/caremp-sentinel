import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X, ShieldCheck, ArrowUp, ArrowRight } from "lucide-react";
import { sendAgentChatMessage } from "../api";

// 4-point Diamond Sparkle logo mark
function SparkleIcon({
  className = "w-5 h-5",
  fill = "currentColor",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={fill}>
      <path d="M12 2C12.4 7.2 16.8 11.6 22 12C16.8 12.4 12.4 16.8 12 22C11.6 16.8 7.2 12.4 2 12C7.2 11.6 11.6 7.2 12 2Z" />
    </svg>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text?: string;
  isInitialCard?: boolean;
}

interface AIHealthCompanionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wellnessScore?: number;
  sleepTime?: string;
  vitalsStatus?: string;
}

export function AIHealthCompanion({
  open,
  onOpenChange,
  wellnessScore: _wellnessScore = 86,
  sleepTime: _sleepTime = "6h 45m",
  vitalsStatus: _vitalsStatus = "steady",
}: AIHealthCompanionProps) {
  const [inputVal, setInputVal] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  // const [messages, setMessages] = useState<Message[]>([
  //   {
  //     id: "user-1",
  //     role: "user",
  //     text: "Why might I feel more tired today?",
  //   },
  //   {
  //     id: "assistant-1",
  //     role: "assistant",
  //     isInitialCard: true,
  //   },
  // ]);
  const [messages, setMessages] = useState<Message[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isThinking) return;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }]);
    setInputVal("");
    setIsThinking(true);

    try {
      const data = await sendAgentChatMessage(text, 1);
      const reply =
        data?.response ||
        "I am listening and here to support your personal health goals.";

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", text: reply },
      ]);
    } catch (err) {
      console.warn(
        "Agent API unreachable, falling back to local contextual guidance:",
        err,
      );
      // Fallback contextual response when agent service is not running
      let reply =
        "Your vitals are steady. Keeping your routine consistent will help balance your recovery.";
      if (text.toLowerCase().includes("baseline")) {
        reply =
          "Compared to your personal 30-day baseline: resting heart rate is 5 bpm lower (70 bpm), and HRV is up +9 ms (45 ms), indicating positive physiological adaptation despite less sleep.";
      } else if (
        text.toLowerCase().includes("sleep") ||
        text.toLowerCase().includes("rest")
      ) {
        reply =
          "You logged 6h 45m last night. Your circadian rhythm is holding steady, but your sleep deficit over 3 consecutive nights suggests prioritizing early wind-down tonight.";
      } else if (
        text.toLowerCase().includes("walk") ||
        text.toLowerCase().includes("exercise")
      ) {
        reply =
          "A light 30-minute walk at an easy pace (below 105 bpm) will encourage lymphatic flow and sleep pressure without overtaxing your cardiovascular system.";
      }

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", text: reply },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full sm:w-[460px] sm:max-w-[460px] md:w-[480px] md:max-w-[480px] bg-transparent backdrop-blur-xl border-l border-white/60 shadow-2xl p-0 flex flex-col h-full overflow-hidden text-[#1a152e] gap-0"
      >
        {/* Fixed Top Navigation Header */}
        <div className="shrink-0 z-20 px-6 sm:px-7 pt-6 sm:pt-7 pb-4 bg-white/30 backdrop-blur-xl border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#eee8fa]/80 backdrop-blur-sm border border-purple-200/50 flex items-center justify-center text-[#734dc6] shadow-2xs">
                  <SparkleIcon className="w-5 h-5 fill-[#734dc6]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1b172f] leading-tight">
                    careMP Companion
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Your personal health companion
                  </p>
                </div>
              </div>
              {/* Privacy Badge */}
              <div className="w-full bg-white/60 backdrop-blur-md border border-white/80 rounded-full py-2 px-3.5 flex items-center gap-2 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                <span className="text-[11px] font-medium text-slate-500">
                  Private by design. Connected to your health.
                </span>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close Companion"
              className="w-9 h-9 rounded-full border border-slate-200/80 bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Scrollable Conversation Window */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-7 py-5 space-y-6 bg-transparent [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Headline Section */}
          {/* <div className="space-y-1.5 pt-1">
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#1a152e] leading-[1.2]">
              A little clarity.
              <br />A little peace of mind.
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Grounded in your signals. Personal to you.
            </p>
          </div> */}

          {/* Today's Context Card */}
          {/* <div className="bg-white/65 backdrop-blur-md border border-white/80 rounded-2xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              TODAY&apos;S CONTEXT
            </span>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              {wellnessScore} wellness · {sleepTime} sleep · Vitals{" "}
              {vitalsStatus}
            </p>
          </div> */}

          {/* Chat Conversation Thread */}
          <div className="space-y-4 pt-1">
            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] bg-[#e8e2f4]/85 backdrop-blur-sm text-[#422e6b] text-xs font-medium px-4 py-3 rounded-2xl rounded-tr-xs shadow-2xs leading-relaxed text-left">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              if (msg.isInitialCard) {
                return (
                  <div key={msg.id} className="space-y-2">
                    {/* Main Insight Card from Image */}
                    <div className="bg-white/75 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/90 shadow-xs space-y-3.5">
                      {/* Sparkle Icon */}
                      <div className="text-[#7b51d4]">
                        <SparkleIcon className="w-4 h-4 fill-[#7b51d4]" />
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-[#1b172f] leading-snug">
                        A little less recovery, not the whole story.
                      </h4>

                      {/* Body Text */}
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        Three nights of reduced sleep may be adding up. Your
                        heart rate and oxygen readings are steady, which is
                        reassuring context.
                      </p>

                      {/* Thin Divider */}
                      <div className="border-t border-slate-200/50 my-3 pt-3">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          WHAT MAY HELP TONIGHT
                        </span>

                        <div className="space-y-2 mt-2.5">
                          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                            <span className="text-slate-400 font-semibold text-[11px]">
                              01
                            </span>
                            <span>A gentle 30-minute walk</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                            <span className="text-slate-400 font-semibold text-[11px]">
                              02
                            </span>
                            <span>Wind down 15 minutes earlier</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Source Footnote */}
                    <p className="text-[11px] text-slate-400 font-normal px-1">
                      Based on recent sleep, activity and resting heart rate.
                    </p>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[90%] bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/90 text-xs text-slate-700 leading-relaxed shadow-xs whitespace-pre-wrap">
                    <div className="flex items-center gap-1.5 text-purple-600 mb-1.5">
                      <SparkleIcon className="w-3.5 h-3.5 fill-purple-600" />
                      <span className="text-[10px] font-bold tracking-wider uppercase">
                        careMP Sentinel
                      </span>
                    </div>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-white/80 backdrop-blur-md rounded-2xl p-3.5 border border-purple-100 shadow-xs flex items-center gap-2.5">
                  <SparkleIcon className="w-3.5 h-3.5 fill-purple-600 animate-pulse" />
                  <span className="text-xs font-medium text-purple-700">
                    Care Coach is reviewing your digital twin &amp; thinking...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Bottom Input & Disclaimer Area */}
        <div className="shrink-0 z-20 px-6 sm:px-7 pt-3.5 pb-6 sm:pb-7 bg-white/30 backdrop-blur-md border-t border-slate-200/50 shadow-lg">
          {/* Quick Suggestion Pill Button */}
          <div className="flex">
            <div className="pt-1 mb-2">
              <button
                onClick={() => handleSend("What's changed from my baseline?")}
                className="w-fit gap-2 bg-white/70 hover:bg-white/90 backdrop-blur-md border border-white/80 rounded-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs group"
              >
                <span>What&apos;s changed from my baseline?</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
            <div className="pt-1 mb-2">
              <button
                onClick={() => handleSend("What's changed from my baseline?")}
                className="w-fit gap-2 bg-white/70 hover:bg-white/90 backdrop-blur-md border border-white/80 rounded-full px-4 py-2.5 flex items-center justify-between text-xs font-medium text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs group"
              >
                <span>Explain today&apos;s summary</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="bg-white/90 backdrop-blur-md rounded-3xl p-2.5 sm:p-3 border border-purple-200/80 shadow-xs flex items-center justify-between gap-2"
          >
            <div className="flex-1 flex flex-col justify-center pl-2">
              {/* <Input
                type="text"
                placeholder="Ask about your health..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isThinking}
                className="border-none shadow-none focus-visible:ring-0 focus-visible:border-none p-0 h-auto text-xs text-slate-800 placeholder:text-slate-400 bg-transparent"
              /> */}
              <textarea
                placeholder="Ask about your health..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isThinking}
                rows={1}
                className="border-none shadow-none focus-visible:ring-0 focus-visible:outline-none p-0 h-auto text-xs text-slate-800 placeholder:text-slate-400 bg-transparent resize-none"
              />
              {/* <span className="text-[10px] text-slate-400 select-none mt-0.5">
                Your day. Your body. Your questions.
              </span> */}
            </div>

            {/* Submit Up-Arrow Button */}
            <button
              type="submit"
              disabled={isThinking || !inputVal.trim()}
              aria-label="Send query"
              className="w-10 h-10 rounded-2xl bg-[#6f4ca8] hover:bg-[#5b3c8f] disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
            >
              <ArrowUp className="w-4 h-4 text-white stroke-[2.5]" />
            </button>
          </form>

          {/* Medical Disclaimer Note */}
          <p className="text-[10px] text-slate-400/90 leading-tight mt-2.5 text-center sm:text-left px-1">
            AI guidance, not a diagnosis. Reach out to your care team if
            symptoms persist or you feel unwell.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default AIHealthCompanion;
