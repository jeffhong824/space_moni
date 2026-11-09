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
import { DetailedHealthAnalysis, type MetricAnalysis, type SystemAnalysis } from './DetailedHealthAnalysis';

interface AiCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  astronaut: AstronautProfile;
  todayRecord: DailyHealthRecord;
  envMetrics: EnvironmentalMetrics;
  tasks: StationTask[];
  onExecuteAction: (action: any) => void;
  initialPrompt?: string;
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
}) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'msg-init',
      sender: 'aura',
      timestamp: '07:46 UTC',
      text: `AURA 飛行外科醫師上線，植物學家 ${astronaut.name.split(' ')[0]}。我正在監測您任務第 ${astronaut.missionDaysElapsed} 天的遙測數據。注意到您的靜息心率升高至 ${todayRecord.restingHR} bpm，HRV 降至 ${todayRecord.hrv} ms。您現在感覺如何？`,
      healthAssessment: {
        status: todayRecord.restingHR > 100 ? 'Attention Required' : 'Nominal',
        summary: `靜息心率 ${todayRecord.restingHR} bpm 需要在實驗週期中持續監測心血管狀態。`,
      },
      suggestedActions: [
        {
          id: 'sug-1',
          label: '安排 20 分鐘補液與電解質對策',
          type: 'ADD_TASK',
          payload: {
            title: '等滲補液與心血管方案',
            module: 'Tranquility ECLSS',
            priority: 'High',
            description: '口服 0.9% 生理食鹽水電解質以對抗微重力頭部體液轉移。',
          },
        },
        {
          id: 'sug-2',
          label: '在每日健康紀錄標記心搏過速異常',
          type: 'LOG_ANOMALY',
          payload: {
            note: `觀測到心搏過速：靜息心率 ${todayRecord.restingHR} bpm，HRV ${todayRecord.hrv} ms。已建議口服補液。`,
          },
        },
      ],
    } as any,
  ]);

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

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

    // Pick an English voice
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('David'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (enVoice) utterance.voice = enVoice;

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
      timestamp: new Date().toUTCString().slice(17, 22) + ' UTC',
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ai-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          astronaut,
          telemetry: todayRecord,
          envMetrics,
          currentTasks: tasks.map((t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status })),
          history: messages.slice(-4).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();
      const aiReply = data.replyText || data.fallback?.replyText || '遙測收訊完成。待命中。';
      const suggestedActions = data.suggestedActions || data.fallback?.suggestedActions || [];
      const healthAssessment = data.healthAssessment || data.fallback?.healthAssessment;
      const detailedAnalysis = data.detailedAnalysis;

      const auraMessage: AiMessage = {
        id: 'aura-' + Date.now(),
        sender: 'aura',
        timestamp: new Date().toUTCString().slice(17, 22) + ' UTC',
        text: aiReply,
        suggestedActions,
        healthAssessment,
        ...(detailedAnalysis && { detailedAnalysis }),
      } as any;

      setMessages((prev) => [...prev, auraMessage]);

      if (speechSynthesisEnabled) {
        speakText(aiReply, auraMessage.id);
      }
    } catch (err) {
      console.error('Error contacting AI doctor:', err);
      const fallbackMsg: AiMessage = {
        id: 'aura-err-' + Date.now(),
        sender: 'aura',
        timestamp: new Date().toUTCString().slice(17, 22) + ' UTC',
        text: `遙測中繼收訊：「${text}」。根據您的靜息心率 103 bpm 及 HRV 14 ms，建議在執行太空植物催化劑實驗前，先完成預定的補液對策。`,
        suggestedActions: [
          {
            id: 'err-act-1',
            label: '新增 20 分鐘休息與補液對策',
            type: 'ADD_TASK',
            payload: {
              title: '強制心血管休息週期',
              module: 'Tranquility ECLSS',
              priority: 'High',
            },
          },
        ],
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl h-[85vh] max-h-[720px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 border border-sky-300 text-sky-700 flex items-center justify-center shadow-2xs">
              <Radio className="w-5 h-5 text-sky-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  AURA · 站務 AI 醫療與任務官
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  即時生物鏈結
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500">
                已連接 {astronaut.name} ({astronaut.role}) · 靜息心率：{todayRecord.restingHR} bpm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (speechSynthesisEnabled) stopSpeaking();
                setSpeechSynthesisEnabled(!speechSynthesisEnabled);
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                speechSynthesisEnabled
                  ? 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title={speechSynthesisEnabled ? '語音輸出啟用' : '語音輸出靜音'}
            >
              {speechSynthesisEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages transcript scroll container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
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
                            <span>停止語音</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>重播語音</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Health Assessment Summary */}
                  {msg.healthAssessment && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className={`px-3 py-2 rounded-lg text-xs ${
                        msg.healthAssessment.status === 'Critical' ? 'bg-rose-50 border border-rose-200 text-rose-900' :
                        msg.healthAssessment.status === 'Attention Required' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                        'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      }`}>
                        <div className="font-bold mb-1">健康狀態：{msg.healthAssessment.status === 'Critical' ? '危急' : msg.healthAssessment.status === 'Attention Required' ? '需注意' : '正常'}</div>
                        <div className="text-[11px] opacity-90">{msg.healthAssessment.summary}</div>
                      </div>
                    </div>
                  )}

                  {/* Detailed Analysis - Collapsible */}
                  {(msg as any).detailedAnalysis && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setExpandedAnalysisId(expandedAnalysisId === msg.id ? null : msg.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        <span>詳細健康分析</span>
                        {expandedAnalysisId === msg.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      
                      {expandedAnalysisId === msg.id && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <DetailedHealthAnalysis
                            metrics={(msg as any).detailedAnalysis.metrics}
                            systems={(msg as any).detailedAnalysis.systems}
                            overallStatus={msg.healthAssessment?.status || 'Nominal'}
                            overallSummary={msg.healthAssessment?.summary || ''}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Action Buttons & Tools */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                        可執行站務行動
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
                <span>AURA 正在合成醫療分析...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 font-mono">
          <span className="text-slate-400 shrink-0">快速詢問：</span>
          <button
            onClick={() => handleSendMessage('為什麼我的靜息心率是 103 bpm？')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-sky-50 text-slate-700 whitespace-nowrap transition-colors"
          >
            心率 103 bpm 分析
          </button>
          <button
            onClick={() => handleSendMessage('我現在可以安全執行植物催化劑實驗嗎？')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-sky-50 text-slate-700 whitespace-nowrap transition-colors"
          >
            實驗準備度評估
          </button>
          <button
            onClick={() => handleSendMessage('建議補液對策方案。')}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-sky-50 text-slate-700 whitespace-nowrap transition-colors"
          >
            補液對策建議
          </button>
        </div>

        {/* Microphone and input dock */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            {/* Microphone Toggle Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl border flex items-center justify-center transition-all shadow-2xs ${
                isListening
                  ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                  : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800'
              }`}
              title={isListening ? '停止麥克風' : '語音輸入'}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5 text-sky-600" />}
            </button>

            {/* Input field */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isListening
                    ? '聆聽中... 請向太空站 AI 說話...'
                    : '與 AI 對話或輸入健康/任務相關問題...'
                }
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
              {isListening && (
                <span className="absolute right-3 top-2.5 text-[10px] font-mono text-rose-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  錄音中
                </span>
              )}
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="p-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">發送</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
