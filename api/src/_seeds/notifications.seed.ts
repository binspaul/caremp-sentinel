import { DataSource } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from '../notifications/entities/notification.entity';
import { Resident } from '../residents/entities/resident.entity';

export async function seedNotifications(dataSource: DataSource) {
  const notificationRepo = dataSource.getRepository(Notification);
  const residentRepo = dataSource.getRepository(Resident);

  const existing = await notificationRepo.count();
  if (existing > 0) {
    console.log('# Notifications already seeded.');
    return;
  }

  const residents = await residentRepo.find();
  const res1 = residents[0]?.id || null;
  const res2 = residents[1]?.id || null;
  const res3 = residents[2]?.id || null;

  const notificationsData = [
    {
      residentId: res1,
      type: NotificationType.FALL,
      priority: NotificationPriority.CRITICAL,
      title: 'Emergency Fall Alert Detected',
      message: 'Rapid kinematic deceleration (3.8g) with 45s immobility in Bedroom Bedside. Immediate nurse triage required.',
      data: { roomNumber: '101', impactG: 3.8, motionlessSeconds: 45 },
      isRead: false,
      isDismissed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
    },
    {
      residentId: res2,
      type: NotificationType.VITAL_BREACH,
      priority: NotificationPriority.HIGH,
      title: 'Resting Heart Rate Tachycardia Warning',
      message: 'Continuous optical PPG recorded resting heart rate spike of 114 bpm sustained for > 5 minutes.',
      data: { roomNumber: '102', vitalType: 'heartRate', value: 114, threshold: 100 },
      isRead: false,
      isDismissed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 35), // 35 mins ago
    },
    {
      residentId: res3,
      type: NotificationType.GEOFENCE,
      priority: NotificationPriority.HIGH,
      title: 'Geofence Boundary Breach Warning',
      message: 'Resident entered restricted corridor zone near East Exit Stairwell. Door magnetic lock engaged.',
      data: { roomNumber: '108', zoneType: 'restricted', floorNumber: 1 },
      isRead: false,
      isDismissed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 62), // 1 hour ago
    },
    {
      residentId: null,
      type: NotificationType.DEVICE,
      priority: NotificationPriority.MEDIUM,
      title: 'BLE Micro-Beacon Low Battery Warning',
      message: 'Anchor Beacon #B-104 (Ground Security Post) reports battery level at 12%. Battery swap required within 48h.',
      data: { beaconMac: 'E4:95:6E:01:01:04', batteryPercent: 12 },
      isRead: true,
      readAt: new Date(Date.now() - 1000 * 60 * 80),
      isDismissed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    },
    {
      residentId: res1,
      type: NotificationType.VITAL_BREACH,
      priority: NotificationPriority.MEDIUM,
      title: 'Nocturnal Restlessness Index Elevated',
      message: '60-GHz FMCW radar pod detected 8 sleep posture shifts within 1 hour. Possible sundowning agitation.',
      data: { roomNumber: '101', podId: 1, sleepDisruptionScore: 78 },
      isRead: true,
      readAt: new Date(Date.now() - 1000 * 60 * 150),
      isDismissed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
    },
    {
      residentId: null,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      title: 'Digital Twin Model Sync Completed',
      message: 'Cohort physiological baselines, circadian rhythm anchors, and pharmacogenomic risks updated successfully.',
      data: { syncedProfilesCount: 5, modelVersion: 'v2.4.0' },
      isRead: true,
      readAt: new Date(Date.now() - 1000 * 60 * 300),
      isDismissed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 400), // 6 hours ago
    },
  ];

  for (const n of notificationsData) {
    const item = notificationRepo.create({
      ...n,
      isDeleted: false,
      updatedAt: n.createdAt,
    });
    await notificationRepo.save(item);
  }

  console.log(`✓ Seeded ${notificationsData.length} clinical notifications.`);
}
