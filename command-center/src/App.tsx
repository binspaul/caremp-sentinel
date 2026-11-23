import React, { useState, useEffect, useCallback } from 'react';
import { Video } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { OverviewTiles } from './components/dashboard/OverviewTiles';
import { RecentVitalsTable } from './components/dashboard/RecentVitalsTable';
import { ResidentsView } from './components/residents/ResidentsView';
import { VitalsView } from './components/vitals/VitalsView';
import { UsersView } from './components/users/UsersView';
import { SimulationModal } from './components/simulation/SimulationModal';
import { TelemedicineModal } from './components/telemedicine/TelemedicineModal';
import { BandsManagementModal } from './components/bands/BandsManagementModal';
import { EmergencyFallAlert } from './components/falls/EmergencyFallAlert';
import { FallsHistoryModal } from './components/falls/FallsHistoryModal';
import { FallsView } from './components/falls/FallsView';
import { BandsView } from './components/bands/BandsView';
import { FacilityMapView } from './components/facility/FacilityMapView';
import { FloorsView } from './components/facility/FloorsView';
import { RoomsView } from './components/facility/RoomsView';
import { BeaconsView } from './components/facility/BeaconsView';
import { RecentFallsAndResidents } from './components/dashboard/RecentFallsAndResidents';
import commandCenterService from './services/commandCenterService';
import { DashboardCounters, Vital, Resident, FallIncident } from './types';

const AUTO_REFRESH_INTERVAL_SECONDS = 60;

const CommandCenterApp: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Filter state for cross-navigation (e.g. clicking a resident in list jumps to vitals)
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null);
  const [mapTargetRoom, setMapTargetRoom] = useState<string | null>(null);
  const [selectedFloorForRooms, setSelectedFloorForRooms] = useState<number | 'all'>('all');

  // Simulation, Telemedicine, Bands Fleet & Falls Modal States
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [isTelemedicineModalOpen, setIsTelemedicineModalOpen] = useState(false);
  const [isBandsModalOpen, setIsBandsModalOpen] = useState(false);
  const [isFallsModalOpen, setIsFallsModalOpen] = useState(false);
  const [latestFall, setLatestFall] = useState<FallIncident | null>(null);
  const [unresolvedFallCount, setUnresolvedFallCount] = useState<number>(0);
  const [recentFalls, setRecentFalls] = useState<FallIncident[]>([]);

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
      const [summary, latestUnresolved, fallCounters, fallsListRes] = await Promise.all([
        commandCenterService.getDashboardSummary(),
        commandCenterService.getLatestUnresolvedFall(),
        commandCenterService.getFallCounters(),
        commandCenterService.getFalls({ skip: 0, limit: 5 }),
      ]);
      setCounters(summary.counters);
      setRecentVitals(summary.recentVitals);
      setResidents(summary.residents);
      setResidentsMap(summary.residentsMap);
      setLatestFall(latestUnresolved);
      setUnresolvedFallCount(fallCounters?.unresolved || (latestUnresolved ? 1 : 0));
      setRecentFalls(fallsListRes.data || []);
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

  const handleVitalSimulated = () => {
    loadDashboardData();
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
        return 'Cognitive surveillance, sundowning pre-agitation triage, and safe-zone geofencing';
      case 'map':
        return '2-Floor interactive BLE beacon indoor topology, memory care safe-zones, and resident tracking';
      case 'floors':
        return 'Facility architectural topology, elevation floor levels, building wings, and blueprints';
      case 'rooms':
        return 'Resident suites, micro-location zones, capacity, safe-perimeter geofencing, and room anchors';
      case 'beacons':
        return 'BLE location beacon inventory, battery telemetry, RSSI calibration, and room anchor pairing';
      case 'vitals':
        return 'Continuous physiological signals, 60-GHz radar sleep restlessness, and autonomic stress feeds';
      case 'falls':
        return 'Kinematic impact telemetry, cognitive freeze-of-gait falls, and emergency dispatch';
      case 'bands':
        return 'Hardware sensor pod fleet inventory, battery telemetry, and resident pairing';
      case 'residents':
        return 'Care recipient registry and cognitive/physiological baseline configurations';
      case 'users':
        return 'User administration, role management, and access controls';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unresolvedFallCount={unresolvedFallCount}
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
          onOpenSimulation={() => setIsSimulationModalOpen(true)}
        />

        <main className="flex-1 px-8 py-8 overflow-y-auto w-full space-y-8">
          {/* Emergency Fall Alert Banner (Always Visible on Top when an Incident is Unresolved) */}
          <EmergencyFallAlert
            incident={latestFall}
            onResolved={loadDashboardData}
            onLaunchTelemedicine={(resId) => {
              setSelectedResidentId(resId);
              setIsTelemedicineModalOpen(true);
            }}
            onLocateOnMap={(location) => {
              setMapTargetRoom(location || null);
              setActiveTab('map');
            }}
          />

          {activeTab === 'dashboard' && (
            <>
              {/* Top Summary Tiles */}
              <section aria-label="Operational Summary Counters">
                <OverviewTiles
                  counters={counters}
                  onTileClick={(tab) => setActiveTab(tab as any)}
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

          {activeTab === 'map' && (
            <FacilityMapView
              lastUpdated={lastUpdated}
              targetRoomNumber={mapTargetRoom}
              onLaunchTelemedicine={(id) => {
                setSelectedResidentId(id);
                setIsTelemedicineModalOpen(true);
              }}
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
              onLaunchTelemedicine={(id) => {
                setSelectedResidentId(id);
                setIsTelemedicineModalOpen(true);
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

          {activeTab === 'residents' && (
            <ResidentsView
              lastUpdated={lastUpdated}
              onSelectResidentVitals={handleSelectResidentVitals}
            />
          )}

          {activeTab === 'users' && <UsersView lastUpdated={lastUpdated} />}
        </main>
      </div>

      {/* Floating Action Button (FAB): AI Tele-Consult available across all screens */}
      <button
        onClick={() => setIsTelemedicineModalOpen(true)}
        aria-label="Open AI Telemedicine Copilot"
        title="Launch AI Telemedicine Consultation & Clinical Brief"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-900/25 dark:shadow-emerald-950/50 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-emerald-400/30 group"
      >
        <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>

      {/* Vital Simulation Modal Dialog */}
      <SimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        onSimulated={handleVitalSimulated}
        residents={residents}
      />

      {/* AI Telemedicine Copilot Modal */}
      <TelemedicineModal
        isOpen={isTelemedicineModalOpen}
        onClose={() => setIsTelemedicineModalOpen(false)}
        resident={residentsMap[selectedResidentId || 1] || residents[0]}
        recentVital={recentVitals[0]}
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
