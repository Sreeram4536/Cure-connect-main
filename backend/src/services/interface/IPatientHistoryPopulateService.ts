export interface IPatientHistoryPopulateService {
  populatePatientHistoryFromAppointments(doctorId: string, userId: string): Promise<any>;
}


