import type { IInsuranceApplication } from './pet-insurance.types.js';

export function toInsuranceApplicationDto(application: IInsuranceApplication) {
  return {
    id: application._id.toString(),
    userId: application.userId.toString(),
    ownerName: application.ownerName,
    ownerEmail: application.ownerEmail,
    ownerPhone: application.ownerPhone,
    petName: application.petName,
    petType: application.petType,
    petAge: application.petAge,
    petBreed: application.petBreed,
    previousIllness: application.previousIllness,
    illnessDocumentUrls: application.illnessDocumentUrls,
    previousSurgery: application.previousSurgery,
    vaccinated: application.vaccinated,
    vaccinationDocumentUrls: application.vaccinationDocumentUrls,
    status: application.status,
    rejectionReason: application.rejectionReason,
    createdAt: application.createdAt,
  };
}
