import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

import * as bcrypt from 'bcrypt';

export async function seedSuperAdmin(
  userRepo: Repository<User>,
) {
  let superAdmin = await userRepo.findOne({
    where: { emailAddress: 'sadmin@caremp.ai' },
  });

  if (!superAdmin) {
    const hashedPassword = await bcrypt.hash('sadmin@123#', 10);

    superAdmin = userRepo.create({
      firstName: 'Super',
      middleName: '',
      lastName: 'Admin',
      description: 'Super administrator',
      emailAddress: 'sadmin@caremp.ai',
      phoneNumber: '+919562468555',
      password: hashedPassword,
      roleName: 'superadmin',
      gender: 1,
      isVerified: true,
      isActive: true,
      isDeleted: false,
      title: 1,
      countryId: 1,
      roleId: 1,
    });

    await userRepo.save(superAdmin);

    console.log('Super admin created successfully.');
  }

  return superAdmin;
}

export async function seedDoctorAdmin(
  userRepo: Repository<User>,
) {
  let doctor = await userRepo.findOne({
    where: { emailAddress: 'doctor@caremp.ai' },
  });

  if (!doctor) {
    const hashedPassword = await bcrypt.hash('doctor@123#', 10);

    doctor = userRepo.create({
      firstName: 'Sarah',
      middleName: '',
      lastName: 'Jenkins',
      description: 'Attending Physician & Clinical Telemedicine Lead',
      emailAddress: 'doctor@caremp.ai',
      phoneNumber: '+919562468556',
      password: hashedPassword,
      roleName: 'admin',
      gender: 2,
      isVerified: true,
      isActive: true,
      isDeleted: false,
      title: 1,
      countryId: 1,
      roleId: 2,
    });

    await userRepo.save(doctor);

    console.log('Doctor admin created successfully.');
  }

  return doctor;
}
