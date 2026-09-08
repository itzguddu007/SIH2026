import React, { useState } from 'react';
import type { AlertItem, ActionItem, NotificationLog } from '../types';
import { api } from '../services/api';
import { Send, CheckCircle, Clock, ShieldAlert, UserCheck, Smartphone, MessageSquare } from 'lucide-react';

interface MunicipalActionCenterProps {
  alerts: AlertItem[];
  actions: ActionItem[];
  logs: NotificationLog[];
  onRefresh: () => void;
}

export const MunicipalActionCenter: React.FC<MunicipalActionCenterProps> = ({
  alerts,
  actions,
  logs,
  onRefresh
}) => {
  const [selectedWardForSms, setSelectedWardForSms] = useState<number>(1);
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP'>('SMS');
  const [recipient, setRecipient] = useState<string>('+919876543210');
  const [customMsg, setCustomMsg] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<any>(null);

  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const extremeAlertsCount = alerts.filter(a => a.risk_level === 'EXTREME').length;

  const handleAssign = async (actionId: number) => {
    const assignee = prompt('Enter name/team to assign this directive:', 'Disaster Response Team Alpha');
    if (!assignee) return;
    try {
      await api.assignAction(actionId, assignee, 'Assigned via Command Dashboard');
      onRefresh();
    } catch (e) {
      alert('Failed to assign action item');
    }
  };

  const handleComplete = async (actionId: number) => {
    try {
      await api.completeAction(actionId, 'Marked completed by Municipal Administrator');
      onRefresh();
    } catch (e) {
      alert('Failed to complete action item');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    try {
      const res = await api.sendNotification({
        ward_id: selectedWardForSms,
        channel,
        recipient,
        custom_message: customMsg.trim() || undefined
      });
      setSendResult(res);
      onRefresh();
    } catch (e: any) {
      setSendResult({ status: 'FAILED', note: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-red-800 font-bold uppercase tracking-wider">Active Extreme Alerts</div>
            <div className="text-3xl font-black text-red-700 mt-1">{extremeAlertsCount}</div>
            <div className="text-[11px] text-red-600 mt-1 font-medium">Requires immediate SOP activation</div>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-amber-800 font-bold uppercase tracking-wider">Total Red Alerts</div>
            <div className="text-3xl font-black text-amber-700 mt-1">{activeAlertsCount}</div>
            <div className="text-[11px] text-amber-600 mt-1 font-medium">Across 25 Wards</div>
          </div>
          <Clock className="w-8 h-8 text-amber-600" />
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-sky-800 font-bold uppercase tracking-wider">Pending Action Items</div>
            <div className="text-3xl font-black text-sky-700 mt-1">
              {actions.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-[11px] text-sky-600 mt-1 font-medium">Municipal Interventions</div>
          </div>
          <UserCheck className="w-8 h-8 text-sky-600" />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Completed Actions</div>
            <div className="text-3xl font-black text-emerald-700 mt-1">
              {actions.filter(a => a.status === 'COMPLETED').length}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 font-medium">Verified Interventions</div>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interventions Checklist & Active Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Municipal Emergency Interventions Checklist
              </h2>
              <span className="text-xs text-slate-500 font-medium">Action Control Room</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Directive</th>
                    <th className="px-3 py-2.5">Target Ward</th>
                    <th className="px-3 py-2.5">Assigned To</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {actions.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 font-semibold text-slate-900 max-w-xs">
                        <div className="font-bold text-amber-700">{act.action_type.replace('_', ' ')}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{act.description}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-700 font-mono">{act.ward_name}</td>
                      <td className="px-3 py-3 text-slate-700 font-mono">{act.assigned_to}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          act.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          act.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-800 border border-sky-300' :
                          'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right space-x-2">
                        {act.status !== 'COMPLETED' && (
                          <>
                            <button
                              onClick={() => handleAssign(act.id)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-sky-700 rounded text-[11px] border border-slate-300 transition"
                            >
                              Assign
                            </button>
                            <button
                              onClick={() => handleComplete(act.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] transition shadow-sm"
                            >
                              Complete
                            </button>
                          </>
                        )}
                        {act.status === 'COMPLETED' && (
                          <span className="text-[11px] text-emerald-700 font-bold">✔ Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Active Emergency Heat Alerts
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.map((alt) => (
                <div key={alt.id} className="bg-red-50/60 border border-red-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-700 uppercase">{alt.risk_level} ALERT</span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium">{alt.expected_start}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{alt.title}</div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{alt.message}</p>
                  <div className="text-[10px] text-slate-500 border-t border-red-200/60 pt-1.5 flex justify-between font-mono">
                    <span>Affected Pop: {alt.affected_population.toLocaleString()}</span>
                    <span>Duration: {alt.expected_duration_hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600" />
                Dispatch Emergency Alert
              </h3>
              <span className="text-xs bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-mono font-semibold">
                SMS / WhatsApp Provider
              </span>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Target Ward</label>
                <select
                  value={selectedWardForSms}
                  onChange={(e) => setSelectedWardForSms(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-sky-500"
                >
                  {Array.from({ length: 25 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Ward {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Channel Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('SMS')}
                    className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 border transition ${
                      channel === 'SMS' 
                        ? 'bg-sky-600 text-white border-sky-500 shadow-sm' 
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> SMS Gateway
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('WHATSAPP')}
                    className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 border transition ${
                      channel === 'WHATSAPP' 
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' 
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp API
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Recipient Phone Number</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Custom Alert Message (Optional)</label>
                <textarea
                  rows={3}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Leave empty for default MoES Red Alert template..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-2.5 rounded-lg shadow transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Dispatching Message...' : `Dispatch ${channel} Alert`}
              </button>
            </form>

            {sendResult && (
              <div className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                sendResult.status === 'DELIVERED' || sendResult.status === 'SENT' 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                <div className="font-bold flex items-center justify-between">
                  <span>STATUS: {sendResult.status}</span>
                  <span>{sendResult.channel}</span>
                </div>
                <div>Provider: {sendResult.provider}</div>
                {sendResult.message_id && <div>ID: {sendResult.message_id}</div>}
                {sendResult.note && <div className="text-[11px] text-slate-600 italic">{sendResult.note}</div>}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Dispatch Logs</h3>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {logs.map((l) => (
                <div key={l.id} className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sky-700 font-bold">{l.recipient}</span>
                    <span className="text-emerald-700 font-bold text-[10px]">{l.status}</span>
                  </div>
                  <div className="text-slate-600 truncate">{l.message_text}</div>
                  <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                    <span>{l.channel} ({l.provider})</span>
                    <span>{l.sent_at.slice(11, 16)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
