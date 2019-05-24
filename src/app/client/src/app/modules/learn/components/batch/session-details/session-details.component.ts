
import { takeUntil, map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { CourseBatchService } from './../../../services';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ResourceService, ServerResponse, ToasterService, ConfigService, LivesessionService } from '@sunbird/shared';
import { PermissionService, UserService, LearnerService } from '@sunbird/core';
import * as _ from 'lodash';
import { IInteractEventObject, IInteractEventEdata } from '@sunbird/telemetry';
import { Subject } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.scss']
})
export class SessionDetailsComponent implements OnInit, OnDestroy {
  public unsubscribe = new Subject<void>();
  batchStatus: Number;
  @Input() courseId: string;
  @Input() enrolledCourse: boolean;
  @Input() batchId: string;
  @Input() courseHierarchy: any;
  @Input() courseProgressData: any;
  public sessionDetails = [];
  public courseInteractObject: IInteractEventObject;
  public updateBatchIntractEdata: IInteractEventEdata;
  public createBatchIntractEdata: IInteractEventEdata;
  public enrollBatchIntractEdata: IInteractEventEdata;
  public unenrollBatchIntractEdata: IInteractEventEdata;
  courseMentor = false;
  batchList = [];
  userList = [];
  showError = false;
  userNames = {};
  showBatchList = false;
  enrolledBatchInfo: any;
  participantsList = [];
  mentorsList = [];
  public courseDetails;
  public children = [];
  public preContent = [];
  public activityContents = [];
  public childContents = [];
  unitDetails = [];
  statusOptions = [
    { name: 'Ongoing', value: 1 },
    { name: 'Upcoming', value: 0 }
  ];
  participantIds = [];
  mentorIds = [];
  showListOfUsers = false;
  todayDate = moment(new Date()).format('YYYY-MM-DD');
  progress = 0;
  isUnenrollbtnDisabled = true;
  contentDetails = [];
  constructor(public resourceService: ResourceService, public permissionService: PermissionService,
    public configService: ConfigService,
    public learnerService: LearnerService,
    public liveSessionService: LivesessionService,
    public userService: UserService, public courseBatchService: CourseBatchService, public toasterService: ToasterService,
    public router: Router, public activatedRoute: ActivatedRoute) {
    this.batchStatus = this.statusOptions[0].value;
  }
  isUnenrollDisabled() {
    this.isUnenrollbtnDisabled = true;
    this.getSessionDetailsOfBatch();
    if (this.courseProgressData && this.courseProgressData.progress) {
      this.progress = this.courseProgressData.progress ? Math.round(this.courseProgressData.progress) : 0;
    }
    if ((!(this.enrolledBatchInfo.hasOwnProperty('endDate')) ||
    (this.enrolledBatchInfo.endDate > this.todayDate)) &&
    (this.enrolledBatchInfo.enrollmentType === 'open') &&
    (this.progress !== 100)) {
      this.isUnenrollbtnDisabled = false;
    }
  }
  ngOnInit() {
    this.unitDetails = this.courseHierarchy.children;
    this.courseInteractObject = {
      id: this.courseHierarchy.identifier,
      type: 'Course',
      ver: this.courseHierarchy.pkgVersion ? this.courseHierarchy.pkgVersion.toString() : '1.0'
    };
    if (this.permissionService.checkRolesPermissions(['COURSE_MENTOR'])) {
      this.courseMentor = true;
    } else {
      this.courseMentor = false;
    }
    if (this.enrolledCourse === true) {
      this.getEnrolledCourseBatchDetails();
    } else {
      this.getAllBatchDetails();
    }
    this.courseBatchService.updateEvent.pipe(
      takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.getAllBatchDetails();
      });
      _.forOwn(this.unitDetails, (courseData: any) => {
        this.getContent(courseData.identifier, courseData);
        this.preContent[courseData.identifier] = this.children;
        this.activityContents[courseData.identifier] = this.childContents;
        this.children = [];
        this.childContents = [];
      });
  }
  public getContent(rootId, children) {
    _.forOwn(children.children, child => {
      if (child.hasOwnProperty('children') && child.children.length > 0) {
        this.getContent(rootId, child);
      } else {
        if (child.hasOwnProperty('activityType') && child.activityType === 'live Session' ) {
          this.children.push(child);
          this.childContents.push(child.identifier);
        }
      }
    });
    }
  getAllBatchDetails() {
    this.showBatchList = false;
    this.showError = false;
    this.batchList = [];
    const searchParams: any = {
      filters: {
        status: this.batchStatus.toString(),
        courseId: this.courseId
      },
      offset: 0,
      sort_by: { createdDate: 'desc' }
    };
    const searchParamsCreator =  _.cloneDeep(searchParams);
    const searchParamsMentor =  _.cloneDeep(searchParams);

    if (this.courseMentor) {
      searchParamsCreator.filters.createdBy = this.userService.userid;
      searchParamsMentor.filters.mentors = [this.userService.userid];
      combineLatest(
        this.courseBatchService.getAllBatchDetails(searchParamsCreator),
        this.courseBatchService.getAllBatchDetails(searchParamsMentor),
      ).pipe(takeUntil(this.unsubscribe))
       .subscribe((data) => {
         console.log('all batches', data);
           this.batchList = _.union(data[0].result.response.content, data[1].result.response.content);
           if (this.batchList.length > 0) {
             this.fetchUserDetails();
           } else {
             this.showBatchList = true;
           }
        }, (err) => {
          this.showError = true;
          this.toasterService.error(this.resourceService.messages.fmsg.m0004);
        });
     } else {
       searchParams.filters.enrollmentType = 'open';
       this.courseBatchService.getAllBatchDetails(searchParams).pipe(
        takeUntil(this.unsubscribe))
        .subscribe((data: ServerResponse) => {
          console.log(data);
          if (data.result.response.content && data.result.response.content.length > 0) {
            this.batchList = data.result.response.content;
            this.fetchUserDetails();
          } else {
            this.showBatchList = true;
          }
        },
        (err: ServerResponse) => {
          this.showError = true;
          this.toasterService.error(this.resourceService.messages.fmsg.m0004);
        });
     }
  }
  getEnrolledCourseBatchDetails() {
    this.courseBatchService.getEnrolledBatchDetails(this.batchId).pipe(
      takeUntil(this.unsubscribe))
      .subscribe((data: ServerResponse) => {
        this.enrolledBatchInfo = data;
        console.log('enroll batches', this.enrolledBatchInfo);
        if (this.enrolledBatchInfo.participant) {
          const participant = [];
          _.forIn(this.enrolledBatchInfo.participant, (value, key) => {
            participant.push(key);
          });
          this.enrolledBatchInfo.participant = participant;
        } else {
          this.enrolledBatchInfo.participant = [];
        }
        this.isUnenrollDisabled();
      }, () => {
        // handle error
      });
      this.fetchUserDetails();
  }
  fetchUserDetails() {
    console.log('all  user batches', this.batchList, 'enrolled batches',  this.enrolledBatchInfo);
if (this.batchList) {
  _.forEach(this.batchList, (val) => {
    this.userList.push(val.createdBy);
    this.participantIds.push(val.participant);
      this.mentorIds.push(val.mentors);
  });
}
if (this.enrolledBatchInfo) {
  this.participantIds.push(this.enrolledBatchInfo.participant);
  this.mentorIds.push(this.enrolledBatchInfo.mentors);

}
    // this.userList = _.compact(_.uniq(this.userList));
    const request = {
      filters: {
        identifier: this.userList
      }
    };
    this.courseBatchService.getUserList(request).pipe(
      takeUntil(this.unsubscribe))
      .subscribe((res) => {
        console.log(res);

        _.forEach(res.result.response.content, (user) => {
          this.userNames[user.identifier] = user;
        });
        this.showBatchList = true;
      }, (err) => {
        this.showError = true;
      });

      this.getUsers(this.participantIds, this.mentorIds);
  }

  createSession(batch) {
    this.router.navigate(['create/livesession/batch', batch.identifier ],
    { relativeTo: this.activatedRoute });
  }
  sessionUpdate(batch) {
    this.router.navigate(['update/livesession/batch', batch.identifier], { relativeTo: this.activatedRoute });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
getUsers(users, mentors) {
const user = users[0];
const mentor = mentors [0];
  const option = {
    url: this.configService.urlConFig.URLS.ADMIN.USER_SEARCH,
    data: {
      request: {
        query: '',
        filters: {
        }
      }
    }
  };
  this.learnerService.post(option).subscribe(data => {
    _.forOwn(data.result.response.content, (value) => {
      if (_.includes(user, value.identifier)) {
        this.participantsList.push(value);
      }
    });
    _.forOwn(data.result.response.content, (value) => {
      if (_.includes(mentor, value.identifier)) {
        this.mentorsList.push(value);
      }
    });
  });
}
getUserandMentorDetails() {
this.showListOfUsers = !this.showListOfUsers;
}
getSessionDetailsOfBatch() {

// tslint:disable-next-line:no-debugger
debugger;
  console.log(this.unitDetails, this.preContent, this.activityContents);
  this.liveSessionService.getSessionDetails().subscribe(contents => {
    const sessionData = [];
    _.forOwn(contents, (content: any) => {
      console.log(content);
      if (content.batchId === this.batchId) {
        _.forOwn(content.sessionDetail, (sessions: any) => {
          if (sessions.contentDetails.length > 0) {
            _.forOwn(sessions.contentDetails, (session: any) => {
              console.log(session);
              sessionData.push(session);
            });
          }
        });
      }
    });
    console.log(sessionData, sessionData.slice());

  });
}

}

