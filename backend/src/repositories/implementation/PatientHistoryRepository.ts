import { BaseRepository } from "../BaseRepository";
import patientHistoryModel, { PatientHistoryDocument, PatientHistoryItem } from "../../models/patientHistoryModel";
import { IPatientHistoryRepository } from "../interface/IPatientHistoryRepository";
import { PaginationResult } from "../interface/IUserRepository";

export class PatientHistoryRepository extends BaseRepository<PatientHistoryDocument> implements IPatientHistoryRepository {
  constructor() {
    super(patientHistoryModel);
  }

  async createOrUpdatePatientHistory(
    userId: string,
    patientData: {
      patientName: string;
      patientEmail: string;
      patientPhone: string;
      patientDob?: Date;
      patientGender?: string;
      allergies?: string[];
      chronicConditions?: string[];
      emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
      };
    }
  ): Promise<PatientHistoryDocument> {
    const existingHistory = await this.model.findOne({ userId });
    
    if (existingHistory) {
      // Update existing patient history
      const updateData = {
        patientName: patientData.patientName,
        patientEmail: patientData.patientEmail,
        patientPhone: patientData.patientPhone,
        ...(patientData.patientDob && { patientDob: patientData.patientDob }),
        ...(patientData.patientGender && { patientGender: patientData.patientGender }),
        ...(patientData.allergies && { allergies: patientData.allergies }),
        ...(patientData.chronicConditions && { chronicConditions: patientData.chronicConditions }),
        ...(patientData.emergencyContact && { emergencyContact: patientData.emergencyContact }),
        updatedAt: new Date(),
      };
      
      return await this.model.findOneAndUpdate(
        { userId },
        updateData,
        { new: true, upsert: false }
      ) as PatientHistoryDocument;
    } else {
      // Create new patient history
      const newHistory = new this.model({
        userId,
        ...patientData,
        medicalHistory: [],
      });
      
      return await newHistory.save();
    }
  }

  async addMedicalHistoryEntry(
    userId: string,
    medicalEntry: PatientHistoryItem
  ): Promise<PatientHistoryDocument | null> {
    return await this.model.findOneAndUpdate(
      { userId },
      { 
        $push: { medicalHistory: medicalEntry },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    ) as PatientHistoryDocument | null;
  }

  async getPatientHistoryByUserId(userId: string): Promise<PatientHistoryDocument | null> {
    return await this.model.findOne({ userId }).lean() as PatientHistoryDocument | null;
  }

  async getPatientHistoryByDoctorId(
    doctorId: string,
    page: number,
    limit: number
  ): Promise<PaginationResult<PatientHistoryDocument>> {
    const skip = (page - 1) * limit;
    
    const filter = {
      'medicalHistory.doctorId': doctorId
    };

    const [data, totalCount] = await Promise.all([
      this.model
        .find(filter)
        .sort({ 'medicalHistory.appointmentDate': -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as Promise<PatientHistoryDocument[]>,
      this.model.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async getPatientHistoryForDoctor(
    doctorId: string,
    userId: string
  ): Promise<PatientHistoryDocument | null> {
    // First try to find patient history with medical entries from this doctor
    let patientHistory = await this.model.findOne({
      userId,
      'medicalHistory.doctorId': doctorId
    }).lean() as PatientHistoryDocument | null;

    // If no history found for this doctor, try to find any patient history for this user
    // This allows showing basic patient info even if the doctor hasn't created medical history entries yet
    if (!patientHistory) {
      patientHistory = await this.model.findOne({
        userId
      }).lean() as PatientHistoryDocument | null;
    }

    return patientHistory;
  }

  async searchPatients(
    doctorId: string,
    searchQuery: string,
    page: number,
    limit: number
  ): Promise<PaginationResult<PatientHistoryDocument>> {
    const skip = (page - 1) * limit;
    
    const filter = {
      'medicalHistory.doctorId': doctorId,
      $or: [
        { patientName: { $regex: searchQuery, $options: 'i' } },
        { patientEmail: { $regex: searchQuery, $options: 'i' } },
        { patientPhone: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    const [data, totalCount] = await Promise.all([
      this.model
        .find(filter)
        .sort({ 'medicalHistory.appointmentDate': -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as Promise<PatientHistoryDocument[]>,
      this.model.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async updatePatientBasicInfo(
    userId: string,
    updateData: {
      patientName?: string;
      patientEmail?: string;
      patientPhone?: string;
      patientDob?: Date;
      patientGender?: string;
      allergies?: string[];
      chronicConditions?: string[];
      emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
      };
    }
  ): Promise<PatientHistoryDocument | null> {
    return await this.model.findOneAndUpdate(
      { userId },
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true }
    ) as PatientHistoryDocument | null;
  }

  async getMedicalHistoryByAppointmentId(appointmentId: string): Promise<PatientHistoryItem | null> {
    const patientHistory = await this.model.findOne({
      'medicalHistory.appointmentId': appointmentId
    }).lean() as PatientHistoryDocument | null;

    if (!patientHistory) return null;

    const medicalEntry = patientHistory.medicalHistory.find(
      entry => entry.appointmentId === appointmentId
    );

    return medicalEntry || null;
  }

  async updateMedicalHistoryEntry(
    userId: string,
    appointmentId: string,
    updateData: Partial<PatientHistoryItem>
  ): Promise<PatientHistoryDocument | null> {
    const updateFields: Record<string, any> = {};
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof PatientHistoryItem] !== undefined) {
        updateFields[`medicalHistory.$.${key}`] = updateData[key as keyof PatientHistoryItem];
      }
    });

    return await this.model.findOneAndUpdate(
      { 
        userId,
        'medicalHistory.appointmentId': appointmentId
      },
      { 
        $set: { ...updateFields, updatedAt: new Date() }
      },
      { new: true }
    ) as PatientHistoryDocument | null;
  }

  async deleteMedicalHistoryEntry(
    userId: string,
    appointmentId: string
  ): Promise<PatientHistoryDocument | null> {
    return await this.model.findOneAndUpdate(
      { userId },
      { 
        $pull: { medicalHistory: { appointmentId } },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    ) as PatientHistoryDocument | null;
  }
}
