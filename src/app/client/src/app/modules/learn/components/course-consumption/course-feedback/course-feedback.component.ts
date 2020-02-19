import { Component, OnInit, Input } from '@angular/core';
import {CourseFeedbackUtilityService} from '../../../services/course-feedback/course-feedback-utility.service';
import {AudioRecorderService} from '../../../services/audio-recorder/audio-recorder.service';
import {ToasterService, ResourceService} from '@sunbird/shared';
@Component({
  selector: 'app-course-feedback',
  templateUrl: './course-feedback.component.html',
  styleUrls: ['./course-feedback.component.scss']
})
export class CourseFeedbackComponent implements OnInit {

  @Input() feedbackDetails = undefined;
  isStarted = false;
  isFeedbackPresent = false;
  audioRecorderSubscription: any;
  analyzerSubscription: any;
  sentimentDetected = 'Analyzing...';
  constructor(
    private readonly utilitySrvc: CourseFeedbackUtilityService,
    private readonly audioRecorder: AudioRecorderService,
    private readonly toasterService: ToasterService,
    public readonly resourceService: ResourceService,
    public readonly cfuSrvc: CourseFeedbackUtilityService, ) { }

  ngOnInit() {
    if (this.feedbackDetails === undefined) {
      console.log('providing default feedback details');
      this.feedbackDetails = {...this.utilitySrvc.getDefaultFeedback};
      this.isFeedbackPresent = true;
    } else if (this.feedbackDetails === null) {
      console.log('No Feedback details present for the course yet');
    } else {
      console.log('Feedback provided by parent, using it');
      this.isFeedbackPresent = true;
    }
  }

  startRecording() {
    console.log('start recording');
    this.audioRecorder.start()
    .then(() => {
      console.log('ok');
      this.isStarted = true;
      this.waitForAudioCompletion();
    })
    .catch(err => {
      // show a notification that --> recording cannot be started
    });
  }

  stopRecording() {
    console.log('stop recording');
    this.audioRecorder.stop();
    this.isStarted = false;
  }

  resetRecording() {
    this.audioRecorder.reset();
    this.isStarted = false;
  }

  waitForAudioCompletion() {
    this.audioRecorderSubscription = this.audioRecorder.audioDataObs.subscribe(isAvailable => {
      if (isAvailable && isAvailable['ok']) {
        console.log('recieved data for upload ', isAvailable);
        // save data to localstorage, corresponding to course id
        // send this audio file for upload
        const recordingData = {
          data: isAvailable['recording'],
          Filename: `${new Date().getDate()}_${new Date().getMonth()+1}_${new Date().getMilliseconds()}_${new Date().getHours()}portal_feedback`,
          Fileextension: 'webm'
        };
        this.utilitySrvc.saveData(recordingData, 'local')
        .then(() => {
          console.log('recording saved to local storage');
        })
        .catch(err => {
          console.log('An error occured while saving your recording locally');
        });
        this.utilitySrvc.sendDataToCloud(recordingData)
        .then(() => {
          console.log('saved recording to the cloud');
          this.toasterService.success('Feedback upload process has started successfully');
          this.audioRecorderSubscription.unsubscribe();
          console.log('unsubscribed');
          // keep track of the feedback behind the scenes
          this.cfuSrvc.startAnalysisPolling(recordingData.Filename);
          console.log('started');
        })
        .catch(err => {
          console.log('An error occured while saving recording to the cloud');
          this.toasterService.error('An error occured while saving recording to the cloud');
          this.audioRecorderSubscription.unsubscribe();
        });
      } else {
        console.log('audio data detected as null');
      }
    });
  }

  ngDestroy() {
    console.log('destroying subscribtion');
    this.audioRecorderSubscription.unsubscribe();
  }

}
