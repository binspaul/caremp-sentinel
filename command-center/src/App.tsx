import React, { useState, useEffect, useCallback } from 'react';
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
import { GenomicsView } from './components/genomics/GenomicsView';
import { TelemedicineModal } from './components/telemedicine/TelemedicineModal';
import commandCenterService from './services/commandCenterService';
import { DashboardCounters, Vital, Resident } from './types';

const AUTO_REFRESH_INTERVAL_SECONDS = 60;

const CommandCenterApp: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Filter state for cross-navigation (e.g. clicking a resident in list jumps to vitals)
  const [selectedResidentId, setSelectedResidentId] = useState<number | null>(null);

  // Simulation & Telemedicine Modal States
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [isTelemedicineModalOpen, setIsTelemedicineModalOpen] = useState(false);

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
      const summary = await commandCenterService.getDashboardSummary();
      setCounters(summary.counters);
      setRecentVitals(summary.recentVitals);
      setResidents(summary.residents);
      setResidentsMap(summary.residentsMap);
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
        return 'Real-time telemetry, deterioration triage, and active digital twins';
      case 'vitals':
        return 'Continuous physiological telemetry signals and sensor feeds';
      case 'genomics':
        return 'Polygenic Risk Scores (PRS), CPIC Pharmacogenomic safety alerts, and functional longevity clocks';
      case 'residents':
        return 'Care recipient genomic and physiological baseline configurations';
      case 'users':
        return 'User administration, role management, and access controls';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200">
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

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
          onOpenTelemedicine={() => setIsTelemedicineModalOpen(true)}
        />

        <main className="flex-1 px-8 py-8 overflow-y-auto w-full space-y-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Top Summary Tiles */}
              <section aria-label="Operational Summary Counters">
                <OverviewTiles
                  counters={counters}
                  onTileClick={(tab) => setActiveTab(tab as any)}
                />
              </section>

              {/* Recent Resident Vitals Table */}
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

          {activeTab === 'vitals' && (
            <VitalsView
              initialResidentId={selectedResidentId}
              onClearResidentFilter={() => setSelectedResidentId(null)}
            />
          )}

          {activeTab === 'genomics' && (
            <GenomicsView
              residents={residents}
              selectedResidentId={selectedResidentId}
              onLaunchTelemedicine={(id) => {
                setSelectedResidentId(id);
                setIsTelemedicineModalOpen(true);
              }}
            />
          )}

          {activeTab === 'residents' && (
            <ResidentsView onSelectResidentVitals={handleSelectResidentVitals} />
          )}

          {activeTab === 'users' && <UsersView />}
        </main>
      </div>

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
