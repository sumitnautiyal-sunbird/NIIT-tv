import { Component, OnInit, ViewChild, OnDestroy, Input } from '@angular/core';
import { takeUntil, mergeMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import {
  RouterNavigationService,
  ResourceService,
  ToasterService,
  ServerResponse,
  LivesessionService
} from '@sunbird/shared';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  NgForm
} from '@angular/forms';
import { UserService } from '@sunbird/core';
import {
  CourseConsumptionService,
  CourseBatchService
} from './../../../services';
import { IImpressionEventInput } from '@sunbird/telemetry';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subject, combineLatest, forkJoin } from 'rxjs';
@Component({
  selector: 'app-livesession',
  templateUrl: './livesession.component.html',
  styleUrls: ['./livesession.component.scss']
})
export class LivesessionComponent implements OnInit {
  createSessionForm: FormGroup;

  @ViewChild('createSessionModel') private createSessionModel;

  private userSearchTime: any;

  showCreateModal = false;
  batchCreatedDate;
  disableSubmitBtn = true;
  @Input() courseId;
  // private courseId: string;
  /**
   * courseCreator
   */
  courseCreator = false;
  /**
   * participantList for mentorList
   */
  participantList = [];

  public selectedParticipants: any = [];

  public selectedMentors: any = [];
  /**
   * batchData for form
   */
  batchData: any;
  /**
   * mentorList for mentors in the batch
   */
  mentorList: Array<any> = [];
  /**
   * form group for batchAddUserForm
   */
  /**
   * To navigate to other pages
   */
  router: Router;
  /**
   * To send activatedRoute.snapshot to router navigation
   * service for redirection to update batch  component
   */
  private activatedRoute: ActivatedRoute;
  /**
   * Reference of UserService
   */
  private userService: UserService;
  /**
   * Reference of UserService
   */
  private courseBatchService: CourseBatchService;
  /**
   * To call resource service which helps to use language constant
   */
  public resourceService: ResourceService;
  /**
   * To show toaster(error, success etc) after any API calls
   */
  private toasterService: ToasterService;
  /**
   * telemetryImpression object for create batch page
   */
  telemetryImpression: IImpressionEventInput;

  public unsubscribe = new Subject<void>();
  unitDetails = [];
  batchId;
  nonliveunit = [];
  public courseConsumptionService: CourseConsumptionService;
  public courseDetails;
  public children = [];
  public preContent = [];
  public activityContents = [];
  public childContents = [];
  public sessionDetails = [];
  constructor(routerNavigationService: RouterNavigationService,
    activatedRoute: ActivatedRoute,
    route: Router,
    resourceService: ResourceService,
    userService: UserService,
    courseBatchService: CourseBatchService,
    toasterService: ToasterService,
    courseConsumptionService: CourseConsumptionService,
    private batchForm: FormBuilder,
    public liveSessionService: LivesessionService
  ) {
    this.resourceService = resourceService;
    this.router = route;
    this.activatedRoute = activatedRoute;
    this.userService = userService;
    this.courseBatchService = courseBatchService;
    this.toasterService = toasterService;
    this.courseConsumptionService = courseConsumptionService;
  }

  ngOnInit() {
    this.batchId = this.activatedRoute.snapshot.params.batchId;
    combineLatest(
      this.activatedRoute.parent.params,
      this.courseBatchService.getEnrolledBatchDetails(this.batchId),
      this.liveSessionService.getSessionDetails()
    ).pipe(mergeMap(data => {
      const params = data[0];
      const getSessionData = [data[1], data[2]];

      this.courseId = params.courseId;
      this.setTelemetryImpressionData();
      this.showCreateModal = true;
      this.getSessionDetails(getSessionData);
      return this.fetchBatchDetails();

    }))
      .subscribe((data) => {
        console.log(data);
        this.unitDetails = data.courseDetails.children;
        console.log('unit details', this.unitDetails);
        _.forOwn(this.unitDetails, (courseData: any) => {
          this.getContent(courseData.identifier, courseData);
          this.preContent[courseData.identifier] = this.children;
          this.activityContents[courseData.identifier] = this.childContents;
          this.children = [];
          this.childContents = [];
        });
      }, (err) => {
        if (err.error && err.error.params.errmsg) {
          this.toasterService.error(err.error.params.errmsg);
        } else {
          this.toasterService.error(this.resourceService.messages.fmsg.m0056);
        }
        this.redirect();
      });
    console.log('Pre Content', this.preContent);
    console.log('ActivityContent', this.activityContents);
  }

  public getContent(rootId, children) {
    _.forOwn(children.children, child => {
      if (child.hasOwnProperty('children') && child.children.length > 0) {
        this.getContent(rootId, child);
      } else {
        if (child.hasOwnProperty('activityType') && child.activityType === 'live Session') {
          for (let l = 0; l < this.sessionDetails.length; l++) {
            if (child.identifier === this.sessionDetails[l].contentId) {
              child['livesessiondata'] = this.sessionDetails[l];

            }
          }
          this.children.push(child);
          this.childContents.push(child.identifier);
        }
      }
    });
  }
  private fetchBatchDetails() {
    return combineLatest(
      this.courseBatchService.getUserList(),
      this.courseConsumptionService.getCourseHierarchy(this.courseId),
      (userDetails, courseDetails) => ({ userDetails, courseDetails })
    );
  }
  private setTelemetryImpressionData() {
    this.telemetryImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url
      }
    };
  }
  public redirect() {
    setTimeout(() => {
      this.router.navigate(['./'], { relativeTo: this.activatedRoute.parent });
    }, 500);
  }
  create(form: NgForm) {
    console.log('Form Submitted', form.value);
    const unitDetail = [];
    const units = [];
    const unitIds = [];
    let unitContents = [];
    let object = {};
    _.forOwn(this.activityContents, (contents: any, unitId) => {
      _.forEach(contents, content => {
        object = {};
        _.forOwn(form.value, (formvalue: any, key) => {
          if (key.split(' ')[0] === content) {
            object['contentId'] = key.split(' ')[0];
            if (key.split(' ')[1] === 'livesessionurl') {
              object['livesessionurl'] = formvalue;
            } else if (key.split(' ')[1] === 'startDate') {
              object['startDate'] = formvalue;
            } else if (key.split(' ')[1] === 'startTime') {
              object['startTime'] = formvalue;
            } else if (key.split(' ')[1] === 'endTime') {
              object['endTime'] = formvalue;
            } else if (key.split(' ')[1] === 'recordedSessionUrl') {
              object['recordedSessionUrl'] = formvalue;
            }
          }
        });
        if (object['livesessionurl'] !== '' && object['startTime'] !== '' && object['startDate'] !== '' &&
          object['endTime'] !== '' && object['recordedSessionUrl'] !== '') {
          units.push(object);
        }
      });
    });
    _.forOwn(this.activityContents, (contents: any, unitId) => {
      _.forOwn(units, (content: any) => {
        if (_.includes(contents, content.contentId)) {
          unitContents.push(content);
        }
      });
      unitDetail[unitId] = unitContents;
      unitIds.push(unitId);
      unitContents = [];
    });
    this.createSessions(unitDetail, unitIds);
  }
  createSessions(sessionDetails, unitIds) {
    console.log('session details', sessionDetails, 'unit id', unitIds);
    const sessiondetail = [];
    _.forOwn(sessionDetails, (session: any, key) => {
      const obj = {
        unitId: key,
        contentDetails: session
      };

      sessiondetail.push(obj);
    });
    const request = {
      courseId: this.courseId,
      batchId: this.batchId,
      batchCreatedDate: this.batchCreatedDate,
      unitIds: unitIds,
      sessionDetail: sessiondetail
    };
    console.log(JSON.stringify(request));
    this.liveSessionService.saveSessionDetails(request)
      .subscribe(response => {
        console.log('res is ', response);
        if (response) {
          this.toasterService.success('Session Updated Successfully');
        }
      }, err => {
        if (err.status === 200) {
          this.toasterService.success('Session Updated Successfully');
        } else {
          console.log('error while updating live session :', err);
          this.toasterService.error('Failed to update live session. Try again later');
        }
      });
  }
  getSessionDetails(getSessionData: Array<object>) {
    const data1 = getSessionData[0];
    const data2 = getSessionData[1];
    console.log('data recieved in getSessionDetails', getSessionData);
    _.forOwn(data1, (batch: any, key) => {
      if (key === 'createdDate') {
        this.batchCreatedDate = batch;
      }
    });
    _.forOwn(data2['sessionDetail'], (sessions: any) => {
      if (sessions.contentDetails.length > 0) {
        _.forOwn(sessions.contentDetails, (session: any) => {
          this.sessionDetails.push(session);
        });
      }
    });

    console.log('session details after live service called', this.sessionDetails);
  }
  onUnitChange(event) {
    console.log(event);
  }
}
