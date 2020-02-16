import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare var MediaRecorder: any;

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService {
  private audioData = new BehaviorSubject<object | null>(null);
  public audioDataObs = this.audioData.asObservable();
  private recorder = undefined;

  constructor() { }

  start(): Promise<any> {
    // reset all the variables
    this.recorder = undefined;
    this.audioData.next(null);
    return new Promise((resolve, reject) => {
      // detect if there is a user media to work with
      window.navigator.getUserMedia({
        audio: true,
        video: false
      },
      (userMedia) => {
        console.log('detected user media', userMedia);
        this.recorder = new MediaRecorder(userMedia);
        this.trackRecording();
        this.recorder.start();
        resolve();
      },
      (err) => {
        console.log('error while detecting usermedia', err);
        this.recorder = undefined;
        reject({ok: false, error: 'Unable to detect user media'});
      });
    });
  }

  stop() {
    if (this.recorder) {
      this.recorder.stop();
    } else {
      console.log('cannot stop when media is not detected');
    }
  }

  reset() {
    console.log('reset triggered');
    this.recorder.stop();
    this.recorder = undefined;
  }

  trackRecording() {
    if (this.recorder) {
      this.recorder.onstop = (event) => {
        console.log('stop triggered', event);
      };
      this.recorder.ondataavailable = (event) => {
        console.log('data blob collected', event);
        this.audioData.next({ok: true, recording: event.data});
      };
      console.log('tracking user audio', this.recorder);
    } else {
      console.log('not tracking anymore');
    }
  }
}
