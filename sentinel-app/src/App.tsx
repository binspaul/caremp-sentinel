import { useState, useEffect } from "react";
import { Iphone16Pro } from "./components/iPhone16Pro";
import { MobileDashboardView } from "./components/mobileDashboardView";
import { Login } from "./Login";
import { PatientTelemedicineModal } from "./components/telemedicine/PatientTelemedicineModal";
import { PatientFallDialog } from "./components/falls/PatientFallDialog";
import {
  getDigitalTwin,
  getVitals,
  getVitalsTrendData,
  getLatestUnresolvedFall,
  type FallIncidentData,
  getResidentDetails,
} from "./api";
import type { VitalRecord } from "./types/vital";
import type { ResidentDigitalTwinData } from "./types/digitalTwin";
import { Resident } from "./types/resident";

export interface User {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  gender: number;
  avatar?: string;
  roleName: string;
  personId?: number;
}

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem("accessToken") || localStorage.getItem("token");
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fullName = [
    currentUser?.firstName,
    currentUser?.middleName,
    currentUser?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const handleLoginSuccess = () => {
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    setAccessToken(token);
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("auth");
    setAccessToken(null);
    setCurrentUser(null);
  };

  const [latestVital, setLatestVital] = useState<VitalRecord | null>(null);
  const [trendVitals, setTrendVitals] = useState<VitalRecord[]>([]);
  const [isTelemedicineOpen, setIsTelemedicineOpen] = useState(false);
  const [activeFall, setActiveFall] = useState<FallIncidentData | null>(null);
  const [digitalTwin, setDigitalTwin] = useState<ResidentDigitalTwinData>();
  const [residentDetails, setResidentDetails] = useState<Resident>();

  const fetchActiveFall = async () => {
    try {
      const residentId = currentUser?.personId
        ? Number(currentUser.personId)
        : undefined;
      const fall = await getLatestUnresolvedFall(residentId);
      setActiveFall(fall);
    } catch (err) {
      console.error("Failed to fetch active fall incident:", err);
    }
  };

  const fetchVitalsData = async () => {
    try {
      fetchActiveFall();
      const list = await getVitals();
      if (list && list.length > 0) {
        setLatestVital(list[0]);
      }
      const trendList = await getVitalsTrendData({
        total: 50,
        skip: 0,
        limit: 100,
      });
      if (trendList && trendList.length > 0) {
        setTrendVitals(trendList);
      }
    } catch (err) {
      console.error("Failed to fetch vitals:", err);
    }
  };

  const fetchDigitalTwin = async () => {
    try {
      const residentId = Number(currentUser?.personId || currentUser?.id || 1);
      const response = await getDigitalTwin(residentId);
      if (response) {
        setDigitalTwin(response);
      }
    } catch (err) {
      console.error("Failed to fetch residents digital twin:", err);
    }
  };

  const fetchResidentDetails = async () => {
    try {
      const residentId = Number(currentUser?.personId || currentUser?.id || 1);
      const response = await getResidentDetails(residentId);
      if (response) {
        setResidentDetails(response);
      }
    } catch (err) {
      console.error("Failed to fetch resident details:", err);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchDigitalTwin();
    fetchResidentDetails();
    // const interval = setInterval(fetchDigitalTwin, 30 * 60 * 1000); // 30 min interval
    // return () => clearInterval(interval);
  }, [accessToken, currentUser?.personId, currentUser?.id]);

  useEffect(() => {
    if (!accessToken) return;
    fetchVitalsData();
  }, [accessToken]);

  const mobileContent = (
    <MobileDashboardView
      latestVital={latestVital}
      trendVitals={trendVitals}
      digitalTwin={digitalTwin}
      residentDetails={residentDetails}
      currentUser={currentUser}
      onSignOut={handleSignOut}
      onOpenTelemedicine={() => setIsTelemedicineOpen(true)}
      onRefreshVitals={fetchVitalsData}
    />
  );

  const currentView = accessToken ? (
    mobileContent
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} />
  );

  return (
    <div className="min-h-screen bg-[#F0F2F6] flex flex-col items-center justify-center">
      {isMobileScreen ? (
        <div className="w-full h-screen overflow-hidden bg-[#F8F9FC]">
          {currentView}
        </div>
      ) : (
        <div className="py-6 flex items-center justify-center">
          <Iphone16Pro width={390} height={780}>
            {currentView}
          </Iphone16Pro>
        </div>
      )}

      {/* Patient Telemedicine Video Modal */}
      {accessToken && (
        <>
          <PatientTelemedicineModal
            isOpen={isTelemedicineOpen}
            onClose={() => setIsTelemedicineOpen(false)}
            latestVital={latestVital}
            patientName={fullName || "Margaret"}
          />

          {/* Patient Hard Fall Detection Reassurance Dialog */}
          <PatientFallDialog
            incident={activeFall}
            onDismiss={() => setActiveFall(null)}
            onCallCareTeam={() => {
              setActiveFall(null);
              setIsTelemedicineOpen(true);
            }}
          />
        </>
      )}
    </div>
  );
}
