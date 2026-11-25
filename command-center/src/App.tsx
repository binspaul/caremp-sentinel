import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio,
  Signal,
  ShieldCheck,
  Scan,
  Building2,
  DoorOpen,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { PageTransitionLoader } from './components/common/PageTransitionLoader';
import { OverviewTiles } from './components/dashboard/OverviewTiles';
import { RecentVitalsTable } from './components/dashboard/RecentVitalsTable';
import { ResidentsView } from './components/residents/ResidentsView';
import { VitalsView } from './components/vitals/VitalsView';
import { UsersView } from './components/users/UsersView';
import { TelemedicineModal } from './components/telemedicine/TelemedicineModal';
import { CareCoachCopilotModal } from './components/copilot/CareCoachCopilotModal';
import { BandsManagementModal } from './components/bands/BandsManagementModal';
import { FallsHistoryModal } from './components/falls/FallsHistoryModal';
import { FallsView } from './components/falls/FallsView';
import { BandsView } from './components/bands/BandsView';
import { RadarPodsView } from './components/radar-pods/RadarPodsView';
import { ChestPatchesView } from './components/chest-patches/ChestPatchesView';
import { FacilityMapView } from './components/facility/FacilityMapView';
import { FloorsView } from './components/facility/FloorsView';
import { RoomsView } from './components/facility/RoomsView';
import { BeaconsView } from './components/facility/BeaconsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { RecentFallsAndResidents } from './components/dashboard/RecentFallsAndResidents';
import { FleetStatusCards } from './components/dashboard/FleetStatusCards';
import { DashboardCharts } from './components/dashboard/DashboardCharts';
import commandCenterService from './services/commandCenterService';
import {
  DashboardCounters,
  Vital,
  Resident,
  FallIncident,
  BandCounters,
  RadarPodCounters,
  ChestPatchCounters,
  BeaconCounters,
  Floor,
  NotificationCounters,
} from './types';

const AUTO_REFRESH_INTERVAL_SECONDS = 60;

const DEFAULT_ELEANOR_VANCE: Resident = {
  id: 1,
  uhid: 'RES-001',
  firstName: 'Eleanor',
  lastName: 'Vance',
  emailAddress: 'eleanor.vance@caremp.ai',
  phoneNumber: '+1-555-019-2831',
  age: 78,
  gender: 2,
  status: 1,
  description: "Resident with FAST Stage 5 Moderate Alzheimer's Disease, sundowning agitation, and circadian sleep inversion. Former elementary school librarian for 32 years.",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEVICE_SUB_TABS: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'bands', label: 'Bands', icon: Radio },
  { id: 'beacons', label: 'Beacons', icon: Signal },
  { id: 'chest-patches', label: 'Chest Patches', icon: ShieldCheck },
  { id: 'radar-pods', label: 'Radar Pods', icon: Scan },
];

const FACILITY_SUB_TABS: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'floors', label: 'Floors', icon: Building2 },
  { id: 'rooms', label: 'Rooms', icon: DoorOpen },
  { id: 'map', label: 'Facility Map', icon: MapPin },
];

const CommandCenterApp: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Filter state for cross-navigation (e.g. clicking a resident in list jumps to vitals)
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null);
  const [mapTargetRoom, setMapTargetRoom] = useState<string | null>(null);
  const [selectedFloorForRooms, setSelectedFloorForRooms] = useState<number | 'all'>('all');

  // Telemedicine, Care Coach Copilot, Bands Fleet & Falls Modal States
  const [isTelemedicineModalOpen, setIsTelemedicineModalOpen] = useState(false);
  const [isCopilotModalOpen, setIsCopilotModalOpen] = useState(false);
  const [isBandsModalOpen, setIsBandsModalOpen] = useState(false);
  const [isFallsModalOpen, setIsFallsModalOpen] = useState(false);
  const [latestFall, setLatestFall] = useState<FallIncident | null>(null);
  const [unresolvedFallCount, setUnresolvedFallCount] = useState<number>(0);
  const [recentFalls, setRecentFalls] = useState<FallIncident[]>([]);

  // Hardware Fleet Counters & Facility Topology States
  const [bandCounters, setBandCounters] = useState<BandCounters | null>(null);
  const [radarCounters, setRadarCounters] = useState<RadarPodCounters | null>(null);
  const [patchCounters, setPatchCounters] = useState<ChestPatchCounters | null>(null);
  const [beaconCounters, setBeaconCounters] = useState<BeaconCounters | null>(null);
  const [notificationCounters, setNotificationCounters] = useState<NotificationCounters | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);

  // Dashboard Data State
  const [counters, setCounters] = useState<DashboardCounters>({
    residentsTotal: 0,
    residentsActive: 0,
    vitalsTotal: 0,
    vitalsRecentCount: 0,
    usersTotal: 0,
    usersActive: 0,
    lastUpdated: new Date(),
  });
  const [recentVitals, setRecentVitals] = useState<Vital[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [residentsMap, setResidentsMap] = useState<Record<number, Resident>>({});
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsRemaining, setSecondsRemaining] = useState(AUTO_REFRESH_INTERVAL_SECONDS);

  // Fetch Dashboard Summary Data
  const loadDashboardData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [
        summary,
        latestUnresolved,
        fallCounters,
        fallsListRes,
        bandCountersRes,
        radarCountersRes,
        patchCountersRes,
        beaconCountersRes,
        notificationCountersRes,
        floorsRes,
      ] = await Promise.all([
        commandCenterService.getDashboardSummary(),
        commandCenterService.getLatestUnresolvedFall(),
        commandCenterService.getFallCounters(),
        commandCenterService.getFalls({ skip: 0, limit: 5 }),
        commandCenterService.getBandCounters().catch(() => null),
        commandCenterService.getRadarPodCounters().catch(() => null),
        commandCenterService.getChestPatchCounters().catch(() => null),
        commandCenterService.getBeaconCounters().catch(() => null),
        commandCenterService.getNotificationCounters().catch(() => null),
        commandCenterService.getFacilityFloors().catch(() => []),
      ]);
      setCounters(summary.counters);
      setRecentVitals(summary.recentVitals);
      setResidents(summary.residents);
      setResidentsMap(summary.residentsMap);
      setLatestFall(latestUnresolved);
      setUnresolvedFallCount(fallCounters?.unresolved || (latestUnresolved ? 1 : 0));
      setRecentFalls(fallsListRes.data || []);
      setBandCounters(bandCountersRes);
      setRadarCounters(radarCountersRes);
      setPatchCounters(patchCountersRes);
      setBeaconCounters(beaconCountersRes);
      setNotificationCounters(notificationCountersRes);
      setFloors(floorsRes);
      setLastUpdated(new Date());
      setSecondsRemaining(AUTO_REFRESH_INTERVAL_SECONDS);
    } catch (error) {
      console.error('Failed to load dashboard telemetry:', error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Initial fetch when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  // 1-Minute Auto Refresh Timer Effect
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Trigger reload when timer hits 0
          loadDashboardData();
          return AUTO_REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, loadDashboardData]);

  // Handle switching to vitals tab with a resident pre-filtered
  const handleSelectResidentVitals = (residentId: number) => {
    setSelectedResidentId(residentId);
    setActiveTab('vitals');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const getPageSubtitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return '';
      case 'notifications':
        return '';
      case 'map':
        return '';
      case 'floors':
        return '';
      case 'rooms':
        return '';
      case 'beacons':
        return '';
      case 'vitals':
        return '';
      case 'falls':
        return '';
      case 'bands':
        return '';
      case 'radar-pods':
        return '';
      case 'chest-patches':
        return '';
      case 'residents':
        return '';
      case 'users':
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200">
      {/* Heartbeat Page Transition Loading Indicator */}
      <PageTransitionLoader activeTab={activeTab} />

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unresolvedFallCount={unresolvedFallCount}
        unreadNotificationCount={notificationCounters?.unread ?? 0}
      />

      {/* Main Command View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="careMP Sentinel"
          subtitle={getPageSubtitle(activeTab)}
          lastUpdated={lastUpdated}
          secondsRemaining={secondsRemaining}
          isRefreshing={isDataLoading}
          onRefresh={loadDashboardData}
          onOpenTelemedicine={() => setIsTelemedicineModalOpen(true)}
          onOpenNotifications={() => setActiveTab('notifications')}
          unreadNotificationCount={notificationCounters?.unread ?? 0}
          onOpenCopilot={() => setIsCopilotModalOpen(true)}
        />

        <main className="flex-1 px-8 py-8 overflow-y-auto w-full space-y-8">
          {/* Devices Sub-navigation Tabs */}
          {DEVICE_SUB_TABS.some((t) => t.id === activeTab) && (
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2 shrink-0">
                Devices:
              </span>
              <div className="flex items-center gap-2">
                {DEVICE_SUB_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Facility Sub-navigation Tabs */}
          {FACILITY_SUB_TABS.some((t) => t.id === activeTab) && (
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2 shrink-0">
                Facility:
              </span>
              <div className="flex items-center gap-2">
                {FACILITY_SUB_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              {/* Top Summary Tiles */}
              <section aria-label="Operational Summary Counters">
                <OverviewTiles
                  counters={counters}
                  bandCounters={bandCounters}
                  radarCounters={radarCounters}
                  patchCounters={patchCounters}
                  beaconCounters={beaconCounters}
                  unresolvedFallCount={unresolvedFallCount}
                  totalFloors={floors.length || 3}
                  totalRooms={floors.reduce((acc, f) => acc + (f.zones?.length || 0), 0) || 18}
                  onTileClick={(tab) => setActiveTab(tab)}
                />
              </section>

              {/* Visual Telemetry Trends & Health Distribution Charts */}
              <section aria-label="Physiological Telemetry & Fleet Graphs">
                <DashboardCharts
                  vitals={recentVitals}
                  residents={residents}
                  residentsMap={residentsMap}
                  bandCounters={bandCounters}
                  radarCounters={radarCounters}
                  patchCounters={patchCounters}
                  beaconCounters={beaconCounters}
                  lastUpdated={lastUpdated}
                  onNavigate={(tab) => setActiveTab(tab)}
                />
              </section>

              {/* 2-Column Card Layout: Recent Falls & Recent Residents (Recent 5 Each) */}
              <section aria-label="Recent Falls and Recent Residents">
                <RecentFallsAndResidents
                  recentFalls={recentFalls}
                  recentResidents={residents}
                  onNavigateToFalls={() => setActiveTab('falls')}
                  onNavigateToResidents={() => setActiveTab('residents')}
                  onSelectResident={handleSelectResidentVitals}
                  onLaunchTelemedicine={(id) => {
                    setSelectedResidentId(id);
                    setIsTelemedicineModalOpen(true);
                  }}
                />
              </section>

              {/* Recent Resident Vitals Table (Recent 10) */}
              <section aria-label="Recent Vitals Stream">
                <RecentVitalsTable
                  vitals={recentVitals}
                  residentsMap={residentsMap}
                  isLoading={isDataLoading}
                  onSelectResident={(id) => handleSelectResidentVitals(id)}
                  onLaunchTelemedicine={(id) => {
                    setSelectedResidentId(id);
                    setIsTelemedicineModalOpen(true);
                  }}
                />
              </section>
            </>
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              residentsMap={residentsMap}
              onNavigateToMap={(roomNumber) => {
                setMapTargetRoom(roomNumber || null);
                setActiveTab('map');
              }}
              onNavigateToVitals={(residentId) => {
                setSelectedResidentId(residentId || null);
                setActiveTab('vitals');
              }}
              onLaunchTelemedicine={(residentId) => {
                setSelectedResidentId(residentId);
                setIsTelemedicineModalOpen(true);
              }}
              onNotificationsUpdated={loadDashboardData}
              lastUpdated={lastUpdated}
            />
          )}

          {activeTab === 'map' && (
            <FacilityMapView
              lastUpdated={lastUpdated}
              targetRoomNumber={mapTargetRoom}
              onLaunchTelemedicine={(id) => {
                setSelectedResidentId(id);
                setIsTelemedicineModalOpen(true);
              }}
              onViewResidentVitals={(id) => {
                setSelectedResidentId(id);
                setActiveTab('vitals');
              }}
              onNavigateToRooms={(floorId) => {
                setSelectedFloorForRooms(floorId || 'all');
                setActiveTab('rooms');
              }}
              onMovementSimulated={loadDashboardData}
            />
          )}

          {activeTab === 'floors' && (
            <FloorsView
              lastUpdated={lastUpdated}
              onNavigateToMap={() => setActiveTab('map')}
              onNavigateToRooms={(floorId) => {
                setSelectedFloorForRooms(floorId || 'all');
                setActiveTab('rooms');
              }}
            />
          )}

          {activeTab === 'rooms' && (
            <RoomsView
              lastUpdated={lastUpdated}
              initialFloorId={selectedFloorForRooms}
              onNavigateToMap={() => setActiveTab('map')}
              onNavigateToFloors={() => setActiveTab('floors')}
            />
          )}

          {activeTab === 'beacons' && (
            <BeaconsView
              lastUpdated={lastUpdated}
              onNavigateToMap={() => setActiveTab('map')}
            />
          )}

          {activeTab === 'vitals' && (
            <VitalsView
              lastUpdated={lastUpdated}
              initialResidentId={selectedResidentId}
              onClearResidentFilter={() => setSelectedResidentId(null)}
            />
          )}

          {activeTab === 'falls' && (
            <FallsView
              lastUpdated={lastUpdated}
              latestFall={latestFall}
              onResolved={loadDashboardData}
              onLaunchTelemedicine={(id) => {
                setSelectedResidentId(id);
                setIsTelemedicineModalOpen(true);
              }}
              onLocateOnMap={(location) => {
                setMapTargetRoom(location || null);
                setActiveTab('map');
              }}
            />
          )}

          {activeTab === 'bands' && (
            <BandsView
              lastUpdated={lastUpdated}
              residents={residents}
              onFleetUpdated={loadDashboardData}
            />
          )}

          {activeTab === 'radar-pods' && (
            <RadarPodsView
              lastUpdated={lastUpdated}
              residents={residents}
              onFleetUpdated={loadDashboardData}
            />
          )}

          {activeTab === 'chest-patches' && (
            <ChestPatchesView
              lastUpdated={lastUpdated}
              residents={residents}
              onFleetUpdated={loadDashboardData}
            />
          )}

          {activeTab === 'residents' && (
            <ResidentsView
              lastUpdated={lastUpdated}
              onSelectResidentVitals={handleSelectResidentVitals}
            />
          )}

          {activeTab === 'users' && <UsersView lastUpdated={lastUpdated} />}
        </main>
      </div>

      {/* Dementia Care Coach Copilot Slide-over Modal */}
      <CareCoachCopilotModal
        isOpen={isCopilotModalOpen}
        onClose={() => setIsCopilotModalOpen(false)}
        residents={residents.length > 0 ? residents : [DEFAULT_ELEANOR_VANCE]}
        initialResidentId={selectedResidentId || 1}
      />

      {/* AI Telemedicine Copilot Modal */}
      <TelemedicineModal
        isOpen={isTelemedicineModalOpen}
        onClose={() => setIsTelemedicineModalOpen(false)}
        resident={residentsMap[selectedResidentId || 1] || residents.find((r) => r.id === 1) || DEFAULT_ELEANOR_VANCE}
        residents={residents.length > 0 ? residents : [DEFAULT_ELEANOR_VANCE]}
        initialResidentId={selectedResidentId || 1}
        recentVital={recentVitals[0]}
        recentVitals={recentVitals}
        onSelectResident={(id) => setSelectedResidentId(id)}
      />

      {/* Hardware Bands & Sensor Pod Fleet Modal */}
      <BandsManagementModal
        isOpen={isBandsModalOpen}
        onClose={() => setIsBandsModalOpen(false)}
        residents={residents}
        onFleetUpdated={loadDashboardData}
      />

      {/* Fall Incidents & Emergency Dispatch Log Modal */}
      <FallsHistoryModal
        isOpen={isFallsModalOpen}
        onClose={() => setIsFallsModalOpen(false)}
        onLaunchTelemedicine={(resId) => {
          setSelectedResidentId(resId);
          setIsTelemedicineModalOpen(true);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CommandCenterApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
