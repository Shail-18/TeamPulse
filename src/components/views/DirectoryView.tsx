import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Phone, Mail, MapPin, 
  Building2, ShieldCheck, Edit3, Trash2, UserCheck, Award, X, Zap, Download, UserPlus, ArrowRight 
} from 'lucide-react';
import { User, UserRole, Team } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import { getRandomAvatar } from '../../utils/avatar';

interface DirectoryViewProps {
  currentUser: User;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [teams, setTeams] = useState<Team[]>(db.getTeams());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'directReports' | 'myTeam'>(
    currentUser.role === 'HR' ? 'all' : currentUser.role === 'Manager' ? 'directReports' : currentUser.role === 'Team Lead' ? 'myTeam' : 'all'
  );

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalSkillInput, setModalSkillInput] = useState('');

  // Assign Manager Modal State (HR)
  const [assigningManagerUser, setAssigningManagerUser] = useState<User | null>(null);
  const [targetManagerId, setTargetManagerId] = useState('');

  // Assign Team Modal State (Manager)
  const [assigningTeamUser, setAssigningTeamUser] = useState<User | null>(null);
  const [targetTeamName, setTargetTeamName] = useState('');

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Employee');
  const [newUserDepartment, setNewUserDepartment] = useState('Engineering');
  const [newUserTitle, setNewUserTitle] = useState('Product Engineer');

  const departments = ['All', 'Engineering', 'Product & Design', 'People Operations', 'Marketing'];
  const roles = ['All', 'HR', 'Manager', 'Team Lead', 'Employee'];

  const handleRefreshUsers = () => {
    const updatedUsers = db.getUsers();
    setUsers([...updatedUsers]);
    setTeams([...db.getTeams()]);
    if (selectedUser) {
      const reFound = updatedUsers.find(u => u.id === selectedUser.id);
      if (reFound) setSelectedUser(reFound);
    }
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      handleRefreshUsers();
    });
    return () => unsub();
  }, [selectedUser]);

  const isAdminOrHr = currentUser.role === 'HR';
  const isManager = currentUser.role === 'Manager';
  const isTeamLead = currentUser.role === 'Team Lead';
  const isHrOrManager = isAdminOrHr || isManager;

  const managersList = users.filter(u => u.role === 'Manager');
  const unassignedCount = users.filter(u => u.role === 'Employee' && (!u.managerId || u.managerId === '' || u.department === 'Unassigned')).length;

  const handleAddModalSkill = (skillToAdd: string) => {
    if (!selectedUser || !skillToAdd.trim()) return;
    const currentSkills = selectedUser.skills || [];
    if (currentSkills.some(s => s.toLowerCase() === skillToAdd.trim().toLowerCase())) return;

    if (isAdminOrHr) {
      db.addSkillToCatalog(skillToAdd.trim());
    }

    const updated = [...currentSkills, skillToAdd.trim()];
    db.updateUserSkills(selectedUser.id, updated);
    setModalSkillInput('');
    handleRefreshUsers();
  };

  const handleRemoveModalSkill = (skillToRemove: string) => {
    if (!selectedUser) return;
    const currentSkills = selectedUser.skills || [];
    const updated = currentSkills.filter(s => s !== skillToRemove);
    db.updateUserSkills(selectedUser.id, updated);
    handleRefreshUsers();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartment === 'All' || u.department === selectedDepartment;
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;

    if (!matchesSearch || !matchesDept || !matchesRole) return false;

    if (activeTab === 'unassigned') {
      return u.role === 'Employee' && (!u.managerId || u.managerId === '' || u.department === 'Unassigned');
    }
    if (activeTab === 'directReports') {
      return u.managerId === currentUser.id || u.department === currentUser.department;
    }
    if (activeTab === 'myTeam') {
      return u.team === currentUser.team || (currentUser.team && u.team?.toLowerCase().includes(currentUser.team.toLowerCase()));
    }

    return true;
  });

  const handleOpenAssignManager = (user: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssigningManagerUser(user);
    setTargetManagerId(user.managerId || (managersList[0]?.id || ''));
  };

  const handleConfirmAssignManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningManagerUser || !targetManagerId) return;
    db.assignEmployeeToManager(assigningManagerUser.id, targetManagerId);
    setAssigningManagerUser(null);
    handleRefreshUsers();
  };

  const handleOpenAssignTeam = (user: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssigningTeamUser(user);
    const defaultTeam = teams.find(t => t.managerId === currentUser.id || t.department === currentUser.department)?.name || user.team || 'Frontend Architecture';
    setTargetTeamName(defaultTeam);
  };

  const handleConfirmAssignTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTeamUser || !targetTeamName) return;
    db.assignEmployeeToTeam(assigningTeamUser.id, targetTeamName);
    setAssigningTeamUser(null);
    handleRefreshUsers();
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!isHrOrManager) {
      alert('Only HR or Managers are allowed to remove employees from the organization.');
      return;
    }
    if (userId === currentUser.id) {
      alert('You cannot delete your own active account.');
      return;
    }
    db.deleteUser(userId);
    setSelectedUser(null);
    handleRefreshUsers();
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    db.addUser({
      name: newUserName,
      email: newUserEmail,
      avatar: getRandomAvatar(newUserName),
      role: newUserRole,
      department: newUserDepartment,
      team: `${newUserDepartment} Team`,
      title: newUserTitle,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      location: 'San Francisco, CA'
    });

    handleRefreshUsers();
    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleExportDirectoryCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const headers = ['ID', 'Name', 'Email', 'Role', 'Department', 'Team', 'Title', 'Joined Date', 'Status', 'Location'];
    const rows = [
      headers.join(','),
      ...filteredUsers.map((u) => [
        `"${u.id}"`,
        `"${u.name}"`,
        `"${u.email}"`,
        `"${u.role}"`,
        `"${u.department}"`,
        `"${u.team || ''}"`,
        `"${u.title || ''}"`,
        `"${u.joinedDate || ''}"`,
        `"${u.status || 'Active'}"`,
        `"${u.location || ''}"`
      ].join(','))
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Team_Directory_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" /> Team & Org Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse corporate hierarchy, contact details, and current team status
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportDirectoryCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-2"
            title="Export Directory as CSV"
          >
            <Download className="w-4 h-4 text-slate-600" /> Export CSV
          </button>

          {isHrOrManager && (
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Team Member
            </button>
          )}
        </div>
      </div>

      {/* Scope Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {isAdminOrHr && (
          <>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Employees ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'unassigned'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> New / Unassigned Signups
              {unassignedCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  {unassignedCount}
                </span>
              )}
            </button>
          </>
        )}

        {isManager && (
          <>
            <button
              onClick={() => setActiveTab('directReports')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'directReports'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Direct Reports
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Org Directory ({users.length})
            </button>
          </>
        )}

        {isTeamLead && (
          <>
            <button
              onClick={() => setActiveTab('myTeam')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'myTeam'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              My Team ({currentUser.team})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Org Directory ({users.length})
            </button>
          </>
        )}

        {!isAdminOrHr && !isManager && !isTeamLead && (
          <button
            onClick={() => setActiveTab('all')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs"
          >
            All Employees ({users.length})
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, title, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Department:
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-800 font-medium focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-2">
            Role:
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-800 font-medium focus:outline-none"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            No employee records match the current filters or assigned roster scope.
          </div>
        ) : (
          filteredUsers.map((member) => {
            const assignedManager = users.find(u => u.id === member.managerId);
            const isUnassignedManager = !member.managerId || member.managerId === '';

            return (
              <div
                key={member.id}
                onClick={() => setSelectedUser(member)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group hover:border-indigo-200 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-indigo-500/30 transition-all shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {member.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <Badge
                            size="sm"
                            variant={
                              member.role === 'HR'
                                ? 'purple'
                                : member.role === 'Manager'
                                ? 'info'
                                : member.role === 'Team Lead'
                                ? 'warning'
                                : 'success'
                            }
                          >
                            {member.role}
                          </Badge>
                          {isHrOrManager && member.id !== currentUser.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(member.id, member.name);
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove Employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{member.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{member.department} • {member.team || 'No Team'}</p>

                      {/* Hierarchy Reporting Badge */}
                      <div className="mt-2 text-[11px]">
                        {assignedManager ? (
                          <span className="text-slate-600 font-medium inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            <Building2 className="w-3 h-3 text-indigo-500" /> Mgr: <strong className="text-slate-800">{assignedManager.name}</strong>
                          </span>
                        ) : member.role === 'Employee' ? (
                          <span className="text-amber-700 font-bold inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <UserPlus className="w-3 h-3 text-amber-600" /> Pending Manager Assignment
                          </span>
                        ) : null}
                      </div>

                      {/* Member Top Skills Chips */}
                      {member.skills && member.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.skills.slice(0, 3).map((sk, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 text-indigo-500" /> {sk}
                            </span>
                          ))}
                          {member.skills.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-bold self-center">
                              +{member.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {/* Quick Action Assignment Buttons for HR & Manager */}
                  {isAdminOrHr && member.role === 'Employee' && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={(e) => handleOpenAssignManager(member, e)}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isUnassignedManager
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {isUnassignedManager ? 'Assign Under Manager' : 'Reassign Manager'}
                      </button>
                    </div>
                  )}

                  {isManager && (member.managerId === currentUser.id || member.department === currentUser.department) && member.role === 'Employee' && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={(e) => handleOpenAssignTeam(member, e)}
                        className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Users className="w-3.5 h-3.5" /> Assign to Team
                      </button>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{member.location || 'Remote'}</span>
                    </div>
                    <Badge
                      size="sm"
                      variant={
                        member.status === 'Active'
                          ? 'success'
                          : member.status === 'On Leave'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || 'Employee Profile'}
        subtitle={selectedUser?.title}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedUser.name}</h3>
                  <Badge variant="purple">{selectedUser.role}</Badge>
                </div>
                <p className="text-xs font-medium text-slate-600">{selectedUser.title}</p>
                <p className="text-xs text-slate-400 mt-1">{selectedUser.department} • {selectedUser.team}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Email</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" /> {selectedUser.email}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Phone</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> {selectedUser.phone || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Location</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" /> {selectedUser.location || 'Remote'}
                </span>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Joined Date</span>
                <span className="font-semibold text-slate-800">{selectedUser.joinedDate}</span>
              </div>
            </div>

            {/* Documented Skills Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" /> Documented Competencies & Skills
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {selectedUser.skills?.length || 0} skills verified
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedUser.skills && selectedUser.skills.length > 0 ? (
                  selectedUser.skills.map((skill, idx) => (
                    <span key={idx} className="bg-white border border-indigo-200 text-indigo-900 font-bold px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 shadow-2xs">
                      <Zap className="w-3 h-3 text-indigo-600 shrink-0" />
                      {skill}
                      {(selectedUser.id === currentUser.id || isHrOrManager) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveModalSkill(skill)}
                          className="ml-0.5 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="Remove skill"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No skills documented yet.</span>
                )}
              </div>

              {(selectedUser.id === currentUser.id || isHrOrManager) && (
                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                  {isAdminOrHr ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add new custom skill to catalog (e.g. React, Python, UX)..."
                        value={modalSkillInput}
                        onChange={(e) => setModalSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddModalSkill(modalSkillInput);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddModalSkill(modalSkillInput)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      Select skills from the organizational catalog below:
                    </p>
                  )}

                  {/* Pre-Approved Catalog Chips */}
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pt-1">
                    {db.getSkillCatalog()
                      .filter((s) => !(selectedUser.skills || []).some((sk) => sk.toLowerCase() === s.toLowerCase()))
                      .slice(0, 10)
                      .map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleAddModalSkill(s)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5 text-indigo-500" /> {s}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Key Person Risk & Single Point of Dependency Indicator */}
            {selectedUser.isKeyPersonRisk && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-900 text-xs">
                <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Key Person Single-Point Dependency: </span>
                  <span>This employee holds specialized domain knowledge or tasks without documented cross-team backup. Ensure active knowledge transfer and handover backups are assigned!</span>
                </div>
              </div>
            )}

            {isHrOrManager && selectedUser.id !== currentUser.id && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Remove Employee
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Assign Manager Modal (HR) */}
      <Modal
        isOpen={!!assigningManagerUser}
        onClose={() => setAssigningManagerUser(null)}
        title="Assign Manager to Employee"
        subtitle={`Select a Reporting Manager for ${assigningManagerUser?.name || 'Employee'}`}
      >
        {assigningManagerUser && (
          <form onSubmit={handleConfirmAssignManager} className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
              <img
                src={assigningManagerUser.avatar}
                alt={assigningManagerUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-200"
              />
              <div>
                <p className="font-bold text-slate-900">{assigningManagerUser.name}</p>
                <p className="text-slate-500">{assigningManagerUser.title} • {assigningManagerUser.email}</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Reporting Manager</label>
              <select
                value={targetManagerId}
                onChange={(e) => setTargetManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50"
              >
                {managersList.map((mgr) => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.name} ({mgr.department} Manager)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Assigning this manager will immediately place the employee in that manager's Team Directory and Dashboard in real-time.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssigningManagerUser(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md"
              >
                Confirm Manager Assignment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Assign Team Modal (Manager) */}
      <Modal
        isOpen={!!assigningTeamUser}
        onClose={() => setAssigningTeamUser(null)}
        title="Assign Employee to Team"
        subtitle={`Select a specific squad/team for ${assigningTeamUser?.name || 'Employee'}`}
      >
        {assigningTeamUser && (
          <form onSubmit={handleConfirmAssignTeam} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
              <img
                src={assigningTeamUser.avatar}
                alt={assigningTeamUser.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-200"
              />
              <div>
                <p className="font-bold text-slate-900">{assigningTeamUser.name}</p>
                <p className="text-slate-500">{assigningTeamUser.title} • {assigningTeamUser.department}</p>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Squad / Team</label>
              <select
                value={targetTeamName}
                onChange={(e) => setTargetTeamName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
              >
                {teams.length > 0 ? (
                  teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.department}) {t.teamLeadName ? `- Lead: ${t.teamLeadName}` : ''}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Frontend Architecture">Frontend Architecture</option>
                    <option value="Core Platform">Core Platform</option>
                    <option value="UX Systems">UX Systems</option>
                  </>
                )}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Assigning this employee to a team will notify the Team Lead and immediately show them in the Team Lead's directory and personal dashboard in live time!
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssigningTeamUser(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
              >
                Confirm Team Assignment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add New Team Member"
        subtitle="Provision a new employee record into the company directory"
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. David Kim"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
            <input
              type="email"
              required
              placeholder="david.k@acmeglobal.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role Designation</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Employee">Employee</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Manager">Manager</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={newUserDepartment}
                onChange={(e) => setNewUserDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="People Operations">People Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
            <input
              type="text"
              required
              placeholder="Senior Frontend Architect"
              value={newUserTitle}
              onChange={(e) => setNewUserTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md"
            >
              Create Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
