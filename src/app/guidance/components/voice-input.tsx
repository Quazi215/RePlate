"use client";

import { useEffect, useRef } from "react";
import { AudioLines, Square } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import styles from "../guidance.module.css";
import { useLocale } from "../../../lib/i18n/client";

export default function VoiceInput({ analyser, requesting, disabled, seconds, onStart, onStop }: {
  analyser: AnalyserNode | null;
  requesting: boolean;
  disabled: boolean;
  seconds: number;
  onStart: () => void;
  onStop: () => void;
}) {
  const { t } = useLocale();
  const waveform = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();
  const expanded = requesting || !!analyser;

  useEffect(() => {
    if (!analyser || reducedMotion || !waveform.current) return;
    const bars = waveform.current.querySelectorAll("rect");
    const data = new Uint8Array(analyser.fftSize);
    let frame: number;
    function draw() {
      analyser!.getByteTimeDomainData(data);
      bars.forEach((bar, index) => {
        const start = Math.floor(index * data.length / bars.length);
        const end = Math.floor((index + 1) * data.length / bars.length);
        let peak = 0;
        for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
        const height = Math.min(28, Math.max(3, peak * 80));
        bar.setAttribute("height", String(height));
        bar.setAttribute("y", String((32 - height) / 2));
      });
      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, [analyser, reducedMotion]);

  return <motion.div className={styles.voiceControl} initial={false}
    animate={{ width: expanded ? 228 : 44 }}
    transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}>
    {expanded && <div className={styles.voiceMeter}>
      <svg ref={waveform} className={styles.voiceWaveform} viewBox="0 0 96 32" aria-hidden="true">
        {Array.from({ length: 24 }, (_, index) => <rect key={index} x={index * 4} y={14.5} width={2} height={3} rx={1} />)}
      </svg>
      <span className={styles.voiceTime} aria-hidden="true">{requesting ? t("Mic…") : `${seconds}s / 30s`}</span>
    </div>}
    <button type="button" className={styles.voiceButton} disabled={requesting || (!analyser && disabled)}
      aria-label={analyser ? t("Stop recording and transcribe") : t("Record your question")}
      title={analyser ? t("Stop recording and transcribe") : t("Record your question")}
      onClick={analyser ? onStop : onStart}>
      {analyser ? <Square size={18} fill="currentColor" aria-hidden="true" /> : <AudioLines size={22} aria-hidden="true" />}
    </button>
  </motion.div>;
}
