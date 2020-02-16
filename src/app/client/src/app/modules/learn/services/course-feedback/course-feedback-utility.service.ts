import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CourseFeedbackUtilityService {

  constructor() { }

  get getDefaultFeedback(): object {
    return {
      feedbackTitle: 'Tell us your feedback about the course?',
    };
  }

  saveData(recordingData: object, dataStore = 'local') {
    return new Promise((resolve, reject) => {
      if (recordingData) {
        window.localStorage.setItem('feedback_courseID', JSON.stringify({recording: 'Here recording data will be stored'}));
        resolve();
      } else {
        reject();
      }
    });
  }
  sendDataToCloud(recordingData) {
    return new Promise((resolve,reject) => {
      window.setTimeout(() => {
        resolve();
      }, 3000);
    });
  }
}
