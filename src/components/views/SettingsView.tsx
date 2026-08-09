import React, { useState } from 'react';
import { 
  Settings, User, Bell, Shield, RefreshCw, CheckCircle2, Save, Award, Plus, X, Zap 
} from 'lucide-react';
import { User as UserType } from '../../types';
import { Badge } from '../common/Badge';
import { db } from '../../services/db';

interface SettingsViewProps {
  currentUser: UserType;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser }) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [skills, setSkills] = useState<string[]>(currentUser.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isAdminOrHr = currentUser.role === 'HR';
  const skillCatalog = db.getSkillCatalog();

  // Notification Toggles
  const [notifLeave, setNotifLeave] = useState(true);
  const [notifSurvey, setNotifSurvey] = useState(true);
  const [notifShoutout, setNotifShoutout] = useState(true);

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) return;

    // If Admin or HR, also save to organization skill catalog
    if (isAdminOrHr) {
      db.addSkillToCatalog(trimmed);
    }

    const updated = [...skills, trimmed];
    setSkills(updated);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateUser(currentUser.id, {
      name,
      email,
      phone,
      location,
      skills
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-600" /> My Profile & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, documented competencies, and notification preferences
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-2xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profile information updated successfully!
        </div>
      )}

      {/* Profile Info Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" /> Personal Details
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Office Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Skills & Competencies Documentation */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" /> Documented Competencies & Skills
                </label>
                <p className="text-[11px] text-slate-500">
                  Document your technical and domain competencies to help managers match you with optimal task assignments.
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 shrink-0">
                {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'} Listed
              </span>
            </div>

            {/* Current Skills List */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px] items-center">
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-indigo-200 text-indigo-900 font-bold text-xs rounded-xl shadow-xs group"
                  >
                    <Zap className="w-3 h-3 text-indigo-600 shrink-0" />
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-0.5 rounded-md transition-colors"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No competencies documented yet. Add your skills below!</span>
              )}
            </div>

            {/* Add Custom Skill Input - ONLY FOR ADMIN AND HR */}
            {isAdminOrHr ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add new custom skill to catalog (e.g., Python, Rust, Strategic Planning)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(newSkillInput);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill(newSkillInput)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Skill
                  </button>
                </div>
                <p className="text-[10px] text-indigo-600 font-medium">
                  👑 HR privilege: Skills created here are automatically saved to the organizational catalog.
                </p>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 font-medium">
                🔒 Custom skill creation is restricted to HR. You can select and add any skills from the organizational catalog below:
              </div>
            )}

            {/* Quick Skill Chips from Pre-Approved Catalog */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Available Skills in Catalog (Click to add to your profile):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50/50 rounded-xl border border-slate-100">
                {skillCatalog
                  .filter((s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase()))
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] font-medium border border-slate-200 hover:border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3 h-3 text-indigo-500" /> {s}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" /> Notification Channels
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Leave Approvals & Time-Off Status</p>
              <p className="text-slate-500 text-[11px]">Receive updates when leave requests are reviewed</p>
            </div>
            <input
              type="checkbox"
              checked={notifLeave}
              onChange={(e) => setNotifLeave(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Pulse Survey Alerts</p>
              <p className="text-slate-500 text-[11px]">Alerts when new surveys are broadcast</p>
            </div>
            <input
              type="checkbox"
              checked={notifSurvey}
              onChange={(e) => setNotifSurvey(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900">Peer Recognition Shoutouts</p>
              <p className="text-slate-500 text-[11px]">Alerts when teammates send you shoutouts</p>
            </div>
            <input
              type="checkbox"
              checked={notifShoutout}
              onChange={(e) => setNotifShoutout(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* System Reset Data */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 text-rose-700">
          <RefreshCw className="w-4 h-4" /> Reset Environment Data
        </h3>
        <p className="text-xs text-slate-500">
          Restores all local company records, leave requests, and surveys back to initial seed defaults.
        </p>

        <button
          onClick={() => {
            if (confirm('Reset all demo data back to factory seed settings?')) {
              db.resetToDefaults();
              alert('Environment reset complete.');
            }
          }}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors"
        >
          Reset Demo Local Data
        </button>
      </div>
    </div>
  );
};
