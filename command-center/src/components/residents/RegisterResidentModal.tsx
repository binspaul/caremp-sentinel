import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UserPlus,
  User,
  Phone,
  Mail,
  ShieldAlert,
  Heart,
  Activity,
  AlertOctagon,
  Building2,
  Calendar,
  Sparkles,
  FileText,
  RotateCcw,
} from 'lucide-react';
import commandCenterService from '../../services/commandCenterService';
import { Floor, RoomZone } from '../../types';

interface RegisterResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResidentCreated: () => void;
}

export const RegisterResidentModal: React.FC<RegisterResidentModalProps> = ({
  isOpen,
  onClose,
  onResidentCreated,
}) => {
  // Form State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [uhid, setUhid] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<number | ''>(74);
  const [gender, setGender] = useState<number>(2); // Default 2: Female
  const [bloodGroupId, setBloodGroupId] = useState<number>(1); // Default 1: O+

  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [address, setAddress] = useState('');

  const [selectedZoneId, setSelectedZoneId] = useState<number | ''>('');
  const [roomNumber, setRoomNumber] = useState('');

  const [fallRiskScore, setFallRiskScore] = useState<number>(35);
  const [hasFallHistory, setHasFallHistory] = useState<boolean>(false);

  const [referenceHeartRate, setReferenceHeartRate] = useState<number>(74);
  const [referenceSystolicBP, setReferenceSystolicBP] = useState<number>(120);
  const [referenceDiastolicBP, setReferenceDiastolicBP] = useState<number>(80);
  const [referenceOxygenSaturation, setReferenceOxygenSaturation] = useState<number>(98);
  const [referenceHrv, setReferenceHrv] = useState<number>(45);

  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // UI state
  const [floors, setFloors] = useState<Floor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available floors and room zones
  useEffect(() => {
    if (isOpen) {
      setError(null);
      commandCenterService
        .getFacilityFloors()
        .then((res) => setFloors(res))
        .catch(() => setFloors([]));
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto calculate age from DOB
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateOfBirth(val);
    if (val) {
      const dob = new Date(val);
      if (!isNaN(dob.getTime())) {
        const diff = Date.now() - dob.getTime();
        const computedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        if (computedAge >= 0 && computedAge <= 130) {
          setAge(computedAge);
        }
      }
    }
  };

  // When room is selected from dropdown, update roomNumber
  const handleZoneSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : '';
    setSelectedZoneId(val);
    if (val !== '') {
      const allZones = floors.flatMap((f) => f.zones || []);
      const matched = allZones.find((z) => z.id === val);
      if (matched) {
        setRoomNumber(matched.roomNumber);
      }
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First Name and Last Name are required.');
      return;
    }
    if (!emailAddress.trim()) {
      setError('A valid Email Address is required for account authentication.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Primary Phone Number is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await commandCenterService.createResident({
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        uhid: uhid.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        age: age !== '' ? Number(age) : 70,
        gender: Number(gender),
        bloodGroupId: Number(bloodGroupId),
        emailAddress: emailAddress.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        emergencyContactNumber: emergencyContactNumber.trim() || phoneNumber.trim(),
        address: address.trim() || undefined,
        roomNumber: roomNumber.trim() || undefined,
        zoneId: selectedZoneId !== '' ? Number(selectedZoneId) : undefined,
        fallRiskScore: Number(fallRiskScore),
        hasFallHistory,
        referenceHeartRate: Number(referenceHeartRate) || 75,
        referenceSystolicBP: Number(referenceSystolicBP) || 120,
        referenceDiastolicBP: Number(referenceDiastolicBP) || 80,
        referenceOxygenSaturation: Number(referenceOxygenSaturation) || 98,
        referenceHrv: Number(referenceHrv) || 45,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        specialNotes: specialNotes.trim() || undefined,
        status: 1,
      });

      onResidentCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create resident:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to register resident. Please verify input fields.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const allAvailableZones: (RoomZone & { floorName: string; floorNum: number })[] = floors.flatMap(
    (f) =>
      (f.zones || []).map((z) => ({
        ...z,
        floorName: f.name,
        floorNum: f.floorNumber,
      })),
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 transition-all my-8 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Register New Resident
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enroll care recipient, assign facility suite, and configure clinical telemetry baselines
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Registration Modal"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 max-h-[72vh]">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold">Registration Incomplete</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Section 1: Demographic & Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-500" />
              <span>Demographic &amp; Identification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Margaret"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Holloway"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  UHID (Identifier)
                </label>
                <input
                  type="text"
                  value={uhid}
                  onChange={(e) => setUhid(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Date of Birth</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={handleDobChange}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="130"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value={1}>Male</option>
                  <option value={2}>Female</option>
                  <option value={3}>Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact, Credentials & Facility Suite */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-cyan-500" />
              <span>Contact &amp; Accommodation Assignment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>Email Address <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="m.holloway@caremp.ai"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1-555-019-4829"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  value={emergencyContactNumber}
                  onChange={(e) => setEmergencyContactNumber(e.target.value)}
                  placeholder="+1-555-019-9111"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>Assign Facility Suite / Room</span>
                </label>
                <select
                  value={selectedZoneId}
                  onChange={handleZoneSelect}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="">Unassigned / Floating</option>
                  {allAvailableZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.floorName} &bull; Room {z.roomNumber} ({z.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Facility Wing or Home Address"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Fall Risk & Clinical Baseline */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Fall Risk Stratification &amp; Physiological Baselines</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Fall Risk Assessment Score: <span className="font-mono font-bold">{fallRiskScore}/100</span>
                    </label>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        fallRiskScore >= 60
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : fallRiskScore >= 30
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {fallRiskScore >= 60 ? 'High Risk' : fallRiskScore >= 30 ? 'Moderate Risk' : 'Low Risk'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fallRiskScore}
                    onChange={(e) => setFallRiskScore(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center pt-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasFallHistory}
                      onChange={(e) => setHasFallHistory(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
                    />
                    <span className="font-medium">Documented Prior Fall Incident History</span>
                  </label>
                </div>
              </div>

              {/* Baseline Vital Inputs */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider font-mono">
                  Personalized Physiological Reference Targets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      Resting HR (bpm)
                    </span>
                    <input
                      type="number"
                      value={referenceHeartRate}
                      onChange={(e) => setReferenceHeartRate(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold text-slate-800 dark:text-slate-100 bg-transparent mt-1 focus:outline-hidden"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-purple-500" />
                      Blood Pressure (mmHg)
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        value={referenceSystolicBP}
                        onChange={(e) => setReferenceSystolicBP(Number(e.target.value))}
                        className="w-12 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-hidden"
                      />
                      <span className="text-slate-400">/</span>
                      <input
                        type="number"
                        value={referenceDiastolicBP}
                        onChange={(e) => setReferenceDiastolicBP(Number(e.target.value))}
                        className="w-12 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-500" />
                      Oxygen Saturation (%)
                    </span>
                    <input
                      type="number"
                      value={referenceOxygenSaturation}
                      onChange={(e) => setReferenceOxygenSaturation(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold text-slate-800 dark:text-slate-100 bg-transparent mt-1 focus:outline-hidden"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-amber-500" />
                      HRV SDNN (ms)
                    </span>
                    <input
                      type="number"
                      value={referenceHrv}
                      onChange={(e) => setReferenceHrv(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold text-slate-800 dark:text-slate-100 bg-transparent mt-1 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Clinical History & Protocol Notes */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Medical History &amp; Clinical Protocol</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Diagnosis &amp; Clinical Background
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Mild Cognitive Impairment (MCI) with hypertension; ambulatory without assistance"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Active Care Protocols &amp; Special Directives
                </label>
                <textarea
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Night-time egress alert active; radar sensor monitoring for restless unassisted bed exit"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              * Required clinical registration fields
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register Resident</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
