import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Radio,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  Bot,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AstronautProfile, DailyHealthRecord, EnvironmentalMetrics, StationTask, AiMessage } from '../types';
import { DetailedHealthAnalysis } from './DetailedHealthAnalysis';
import { callAiDoctor } from '../api/aiDoctor';
import { packHealthPayload, buildOfflineTwoLevelAnalysis } from '../domain/healthPacking';
import type { SpaceEnvironmentPayload } from '../domain/spaceWeather';
import type { SelfCheckEntry } from '../domain/healthThresholds';
import { useI18n } from '../i18n/I18nProvider';
import { localizeKey, statusLabel } from '../i18n/index';
import { toneFromStatus } from '../ui/StatusPill';
import { taipeiStamp } from '../world/worldState';

interface AiCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  astronaut: AstronautProfile;
  todayRecord: DailyHealthRecord;
  envMetrics: EnvironmentalMetrics;
  tasks: StationTask[];
  onExecuteAction: (action: { type: string; label: string; payload?: Record<string, string> }) => void;
  initialPrompt?: string;
  spaceEnvironment?: SpaceEnvironmentPayload | null;
  selfCheck?: SelfCheckEntry | null;
  liveVitals?: { hr: number; hrv: number; spo2: number };
}

export const AiCallModal: React.FC<AiCallModalProps> = ({
  isOpen,
  onClose,
  astronaut,
  todayRecord,
  envMetrics,
  tasks,
  onExecuteAction,
  initialPrompt,
  spaceEnvironment = null,
  selfCheck = null,
  liveVitals,
}) => {
  const { t, lang } = useI18n();
  const packed = packHealthPayload(astronaut, todayRecord, envMetrics, spaceEnvironment, selfCheck, lang);
  const liveHr = liveVitals?.hr ?? todayRecord.restingHR;
  const liveHrv = liveVitals?.hrv ?? todayRecord.hrv;
  const buildGreeting = (): AiMessage => ({
      id: 'msg-init',
      sender: 'aura',
      timestamp: taipeiStamp(),
      text: t('ai.greeting', {
        name: astronaut.name,
        day: astronaut.missionDaysElapsed,
        summary: packed.overall.summary,
        hr: liveHr,
        hrv: liveHrv,
      }),
      healthAssessment: packed.overall,
      detailedAnalysis: { metrics: packed.metrics, systems: packed.systems },
      analysisMode: 'offline_fallback',
      dataQuality: {
        telemetry: t('badge.simTelemetry'),
        cabin: packed.cabinEnvironment ? t('badge.simCabin') : t('ai.noCabin'),
        spaceEnvironment: packed.spaceEnvironment
          ? t('ai.wxOfficial', { status: packed.spaceEnvironment.overallStatus })
          : t('ai.noWx'),
      },
      suggestedActions: packed.overall.status === 'Normal'
        ? [
            {
              id: 'sug-ack',
              label: t('ai.ackRoutine'),
              type: 'LOG_ANOMALY',
              payload: { note: `${astronaut.name}: ${packed.overall.status}` },
            },
          ]
        : [
            {
              id: 'sug-1',
              label: t('ai.hydrate'),
              type: 'ADD_TASK',
              payload: {
                title: t('ai.hydrateTask'),
                module: 'mod.tranquility',
                priority: 'High',
              },
            },
            {
              id: 'sug-2',
              label: t('ai.logCardio'),
              type: 'LOG_ANOMALY',
              payload: {
                note: `${astronaut.name}: HR ${liveHr} bpm, HRV ${liveHrv} ms.`,
              },
            },
          ],
  });

  const [messages, setMessages] = useState<AiMessage[]>([buildGreeting()]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [auraTab, setAuraTab] = useState<'chat' | 'report'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const greetingKeyRef = useRef(`${astronaut.id}-${todayRecord.date}`);

  useEffect(() => {
    if (!isOpen) return;
    const key = `${astronaut.id}-${todayRecord.date}`;
    if (greetingKeyRef.current === key && messages.length > 0) return;
    greetingKeyRef.current = key;
    setMessages([buildGreeting()]);
    setExpandedAnalysisId(null);
  }, [isOpen, astronaut.id, todayRecord.date]);

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'zh-TW';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Audio speech synthesis helper
  const speakText = (text: string, msgId: string) => {
    if (!speechSynthesisEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.lang = 'zh-TW';
    const voices = window.speechSynthesis.getVoices();
    const zhVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('zh-tw') || v.lang.toLowerCase().startsWith('zh-hant')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
    if (zhVoice) utterance.voice = zhVoice;

    utterance.onstart = () => setActiveSpeakingId(msgId);
    utterance.onend = () => setActiveSpeakingId(null);
    utterance.onerror = () => setActiveSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setInputText('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isProcessing) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopSpeaking();

    const userMessage: AiMessage = {
      id: 'user-' + Date.now(),
      sender: 'astronaut',
      timestamp: taipeiStamp(),
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const data = await callAiDoctor({
        message: text,
        astronaut,
        telemetry: todayRecord,
        envMetrics,
        spaceEnvironment,
        selfCheck,
        tasks,
        history: messages.slice(-4).map((m) => ({ sender: m.sender, text: m.text })),
        lang,
      });

      const auraMessage: AiMessage = {
        id: 'aura-' + Date.now(),
        sender: 'aura',
        timestamp: taipeiStamp(),
        text: data.replyText || t('ai.standby'),
        suggestedActions: data.suggestedActions,
        healthAssessment: data.healthAssessment,
        detailedAnalysis: data.detailedAnalysis,
        analysisMode: data.analysisMode,
        dataQuality: data.dataQuality,
      };

      setMessages((prev) => [...prev, auraMessage]);

      if (speechSynthesisEnabled) {
        speakText(auraMessage.text, auraMessage.id);
      }
    } catch (err) {
      console.error('Error contacting AI doctor:', err);
      const fallbackPacked = packHealthPayload(astronaut, todayRecord, envMetrics, spaceEnvironment, selfCheck, lang);
      const fallback = buildOfflineTwoLevelAnalysis(text, fallbackPacked, lang);
      const fallbackMsg: AiMessage = {
        id: 'aura-err-' + Date.now(),
        sender: 'aura',
        timestamp: taipeiStamp(),
        text: fallback.replyText,
        suggestedActions: fallback.suggestedActions,
        healthAssessment: fallback.healthAssessment,
        detailedAnalysis: fallback.detailedAnalysis,
        analysisMode: fallback.analysisMode,
        dataQuality: fallback.dataQuality,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const initialPromptSentRef = useRef<string | null>(null);
  useEffect(() => {
    if (isOpen && initialPrompt && initialPromptSentRef.current !== initialPrompt) {
      initialPromptSentRef.current = initialPrompt;
      const timer = setTimeout(() => {
        handleSendMessage(initialPrompt);
      }, 300);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      initialPromptSentRef.current = null;
    }
  }, [isOpen, initialPrompt]);


  const handleActionClick = (msgId: string, action: any) => {
    onExecuteAction(action);

    // Mark action as executed in the message
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId && msg.suggestedActions) {
          return {
            ...msg,
            suggestedActions: msg.suggestedActions.map((act) =>
              act.id === action.id ? { ...act, executed: true } : act
            ),
          };
        }
        return msg;
      })
    );
  };

  if (!isOpen) return null;

  const lastAi = [...messages].reverse().find((m) => m.sender === 'aura');
  const offline = lastAi?.analysisMode === 'offline_fallback' || !lastAi;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="presentation">
      <button type="button" className="absolute inset-0 sm-scrim" aria-label={t('common.close')} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aura-dialog-title"
        className="relative h-full w-full max-w-md sm-sheet-panel rounded-l-[32px] flex flex-col overflow-hidden sm-sheet-in"
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-200 via-violet-200 to-fuchsia-200" />
            <div>
              <div className="flex items-center gap-2">
                <h3 id="aura-dialog-title" className="font-display text-2xl tracking-tight">
                  AURA
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white text-stone-500">
                  {offline ? t('ui.offlineMode') : t('ai.liveMode')}
                </span>
              </div>
              {offline && (
                <p role="status" className="mt-1 text-[11px] font-semibold text-amber-800">
                  {t('ai.offlineBanner')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (speechSynthesisEnabled) stopSpeaking();
                setSpeechSynthesisEnabled(!speechSynthesisEnabled);
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                speechSynthesisEnabled ? 'bg-white text-[var(--sm-cobalt)]' : 'bg-white/60 text-stone-400'
              }`}
              title={speechSynthesisEnabled ? t('ai.speechOn') : t('ai.speechOff')}
            >
              {speechSynthesisEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              aria-label={t('common.close')}
              title={t('common.close')}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-3">
          <div className="inline-flex p-1 rounded-full bg-white/80">
            <button
              type="button"
              onClick={() => setAuraTab('chat')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold ${auraTab === 'chat' ? 'bg-[var(--sm-cobalt)] text-white' : 'text-stone-500'}`}
            >
              {t('ui.chat')}
            </button>
            <button
              type="button"
              onClick={() => setAuraTab('report')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold ${auraTab === 'report' ? 'bg-[var(--sm-cobalt)] text-white' : 'text-stone-500'}`}
            >
              {t('ui.report')}
            </button>
          </div>
        </div>

        {auraTab === 'report' && lastAi?.healthAssessment && (
          <div className="px-5 pb-3 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--sm-apricot)]" />
              {t('ui.noticed', { item: lastAi.healthAssessment.summary })}
            </p>
            <p className="text-stone-500">{t('ui.why', { item: lastAi.healthAssessment.summary })}</p>
            <p>{t('ui.nextAction', { item: t('ai.hydrate') })}</p>
            <button
              type="button"
              onClick={() => lastAi.suggestedActions?.[0] && handleActionClick(lastAi.id, lastAi.suggestedActions[0])}
              className="h-11 w-full rounded-full bg-[var(--sm-cobalt)] text-white text-sm font-semibold"
            >
              {t('ui.addHydration')}
            </button>
            <button
              type="button"
              onClick={() => lastAi.suggestedActions?.[1] && handleActionClick(lastAi.id, lastAi.suggestedActions[1])}
              className="h-11 w-full rounded-full bg-white text-sm font-semibold"
            >
              {t('ui.logObservation')}
            </button>
          </div>
        )}

        {/* Messages transcript scroll container */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 ${auraTab === 'report' ? 'hidden' : ''}`}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'astronaut';
            const isSpeaking = activeSpeakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-2xs space-y-2.5 ${
                    isUser
                      ? 'bg-sky-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-80 pb-1 border-b border-current/10">
                    <span className="font-semibold">
                      {isUser ? astronaut.name : 'AURA Flight Surgeon'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message body */}
                  <div className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-line font-sans">
                    {msg.text}
                  </div>

                  {/* Audio readback button for AI messages */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-500">
                      <button
                        onClick={() =>
                          isSpeaking ? stopSpeaking() : speakText(msg.text, msg.id)
                        }
                        className="flex items-center gap-1 text-sky-600 hover:text-sky-800 transition-colors"
                      >
                        {isSpeaking ? (
                          <>
                            <Square className="w-3 h-3 text-rose-500 fill-current" />
                            <span>{t('ai.stopSpeech')}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>{t('ai.replay')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {msg.analysisMode === 'offline_fallback' && (
                    <p className="text-[11px] font-semibold text-amber-950 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      {t('ai.offlineBanner')}
                    </p>
                  )}

                  {/* Health Assessment Summary */}
                  {msg.healthAssessment && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className={`px-3 py-2 rounded-lg text-xs ${
                        toneFromStatus(msg.healthAssessment.status) === 'crit' ? 'bg-rose-50 border border-rose-200 text-rose-900' :
                        toneFromStatus(msg.healthAssessment.status) === 'warn' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                        'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      }`}>
                        <div className="font-bold mb-1">{t('ai.healthStatus', { status: statusLabel(lang, msg.healthAssessment.status) })}</div>
                        <div className="text-[11px] opacity-90">{msg.healthAssessment.summary}</div>
                      </div>
                    </div>
                  )}

                  {msg.detailedAnalysis && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setExpandedAnalysisId(expandedAnalysisId === msg.id ? null : msg.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-sky-600"
                        aria-expanded={expandedAnalysisId === msg.id}
                      >
                        <span>{t('ai.detailToggle')}</span>
                        {expandedAnalysisId === msg.id ? (
                          <ChevronUp className="w-4 h-4" aria-hidden />
                        ) : (
                          <ChevronDown className="w-4 h-4" aria-hidden />
                        )}
                      </button>
                      {expandedAnalysisId === msg.id && (
                        <div className="mt-2">
                          <DetailedHealthAnalysis
                            metrics={msg.detailedAnalysis.metrics}
                            systems={msg.detailedAnalysis.systems}
                            overallStatus={msg.healthAssessment?.status || 'Normal'}
                            overallSummary={msg.healthAssessment?.summary || ''}
                            dataQuality={msg.dataQuality}
                            analysisMode={msg.analysisMode}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Action Buttons & Tools */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                        {t('ai.actions')}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {msg.suggestedActions.map((action) => (
                          <button
                            key={action.id}
                            disabled={action.executed}
                            onClick={() => handleActionClick(msg.id, action)}
                            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all ${
                              action.executed
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 opacity-80 cursor-default'
                                : 'bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 font-medium active:scale-98 cursor-pointer'
                            }`}
                          >
                            <span className="flex-1">{action.label}</span>
                            {action.executed ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <ExternalLink className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-3 text-xs items-center text-slate-500 font-mono">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                <span>{t('ai.synthesizing')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="relative shrink-0 overflow-hidden">
          <p className="px-5 pt-2 text-[11px] text-stone-400">{t('ai.quick')}</p>
          <div className="px-5 pb-2 flex items-center gap-2 overflow-x-auto sm-snap sm-chip-fade text-[11px] min-w-0">
            <button
              onClick={() => handleSendMessage(t('ai.qHrPrompt', { n: liveHr }))}
              className="px-3 py-1 rounded-full bg-white text-stone-700 whitespace-nowrap shrink-0 snap-start"
            >
              {t('ai.qHr', { n: liveHr })}
            </button>
            <button
              onClick={() => handleSendMessage(t('ai.qExpPrompt'))}
              className="px-3 py-1 rounded-full bg-white text-stone-700 whitespace-nowrap shrink-0 snap-start"
            >
              {t('ai.qExp')}
            </button>
            <button
              onClick={() => handleSendMessage(t('ai.qHydratePrompt'))}
              className="px-3 py-1 rounded-full bg-white text-stone-700 whitespace-nowrap shrink-0 snap-start"
            >
              {t('ai.qHydrate')}
            </button>
          </div>
        </div>

        <div className="p-4 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <button
              type="button"
              onClick={toggleListening}
              className={`w-11 h-11 rounded-full flex items-center justify-center ${
                isListening ? 'bg-rose-500 text-white' : 'bg-white text-stone-600'
              }`}
              title={isListening ? t('ai.micOn') : t('ai.micOff')}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? t('ai.listen') : t('ai.placeholder')}
                className="w-full h-11 px-4 text-sm bg-white rounded-full"
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="w-11 h-11 rounded-full bg-[var(--sm-cobalt)] text-white flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">{t('ai.send')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
