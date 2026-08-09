import React, { useState, useEffect } from 'react';
import { 
  Award, Heart, Plus, ThumbsUp, Sparkles, Filter, MessageSquare, Trash2 
} from 'lucide-react';
import { User as UserType, PeerShoutout } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';

interface ShoutoutsViewProps {
  currentUser: UserType;
  isCreateOpenInitially?: boolean;
  onCloseCreateInitial?: () => void;
}

export const ShoutoutsView: React.FC<ShoutoutsViewProps> = ({
  currentUser,
  isCreateOpenInitially = false,
  onCloseCreateInitial
}) => {
  const [shoutouts, setShoutouts] = useState<PeerShoutout[]>(db.getShoutouts());
  const [users, setUsers] = useState<UserType[]>(db.getUsers());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(isCreateOpenInitially);

  // Form State
  const [toUserId, setToUserId] = useState('');
  const [category, setCategory] = useState<'Innovation' | 'Team Player' | 'Excellence' | 'Leadership' | 'Customer First'>('Excellence');
  const [message, setMessage] = useState('');

  const refreshData = () => {
    setShoutouts(db.getShoutouts());
    setUsers(db.getUsers());
  };

  useEffect(() => {
    const unsub = db.subscribe(() => refreshData());
    return () => unsub();
  }, []);

  const categories = ['All', 'Excellence', 'Innovation', 'Team Player', 'Leadership', 'Customer First'];

  const filteredShoutouts = shoutouts.filter((s) => {
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  const handleToggleLike = (shoutoutId: string) => {
    db.toggleLikeShoutout(shoutoutId, currentUser.id);
    refreshData();
  };

  const handleDeleteShoutout = (shoutoutId: string) => {
    db.deleteShoutout(shoutoutId);
    refreshData();
  };

  const handleSendShoutoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserId || !message) return;

    const targetUser = users.find((u) => u.id === toUserId);
    if (!targetUser) return;

    db.addShoutout({
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      fromUserAvatar: currentUser.avatar,
      toUserId: targetUser.id,
      toUserName: targetUser.name,
      toUserAvatar: targetUser.avatar,
      category: category,
      message: message
    });

    refreshData();
    setIsModalOpen(false);
    if (onCloseCreateInitial) onCloseCreateInitial();
    setMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" /> Peer Recognition & Culture Wall
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Celebrate colleagues, recognize core values excellence, and boost team morale
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Award className="w-4 h-4" /> Recognize Teammate
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
        <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shoutouts Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShoutouts.map((shoutout) => {
          const isLikedByMe = shoutout.likes.includes(currentUser.id);

          return (
            <div
              key={shoutout.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={shoutout.fromUserAvatar}
                      alt={shoutout.fromUserName}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{shoutout.fromUserName}</p>
                      <p className="text-[10px] text-slate-400">Recognized <strong className="text-indigo-600">{shoutout.toUserName}</strong></p>
                    </div>
                  </div>
                  <Badge variant="purple">{shoutout.category}</Badge>
                </div>

                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-700 italic leading-relaxed">"{shoutout.message}"</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleToggleLike(shoutout.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isLikedByMe
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLikedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {shoutout.likes.length} Praise
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {new Date(shoutout.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteShoutout(shoutout.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Shoutout"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Give Shoutout Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Send Peer Recognition"
        subtitle="Publicly celebrate a colleague's impact and work"
      >
        <form onSubmit={handleSendShoutoutSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Teammate</label>
            <select
              required
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">-- Choose Colleague --</option>
              {users
                .filter((u) => u.id !== currentUser.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Core Value Tag</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            >
              <option value="Excellence">Excellence & Quality</option>
              <option value="Innovation">Innovation & Creativity</option>
              <option value="Team Player">Team Player & Support</option>
              <option value="Leadership">Leadership & Ownership</option>
              <option value="Customer First">Customer First</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recognition Note</label>
            <textarea
              rows={3}
              required
              placeholder="What specific accomplishment or support would you like to thank them for?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
            >
              Broadcast Shoutout
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
