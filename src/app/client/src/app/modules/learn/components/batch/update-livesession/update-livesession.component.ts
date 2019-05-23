import { Component, OnInit, ViewChild, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { takeUntil, mergeMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterNavigationService, ResourceService, ToasterService, ServerResponse, LivesessionService } from '@sunbird/shared';
import { FormGroup, FormControl, Validators, FormBuilder, NgForm } from '@angular/forms';
import { UserService } from '@sunbird/core';
import { CourseConsumptionService, CourseBatchService, } from './../../../services';
import { IImpressionEventInput } from '@sunbird/telemetry';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subject, combineLatest, empty } from 'rxjs';

@Component({
  selector: 'app-update-livesession',
  templateUrl: './update-livesession.component.html',
  styleUrls: ['./update-livesession.component.scss']
})
export class UpdateLivesessionComponent implements OnInit, AfterViewInit {
  updateSessionForm: FormGroup;

  // @ViewChild('createSessionModel') private createSessionModel;

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
  public courseConsumptionService: CourseConsumptionService;
  public courseDetails;
  public children = [];
  public preContent = [];
  public childContents = [];
  public sessionDetails = {};
  public contentDetails = {};
  sessionContents = [];
  units = [];
  url;
  starttime;
  endtime;
  unitChange = true;
  contentChange = true;
  contents = [];
     // tslint:disable-next-line:max-line-length
pattern = new RegExp(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i);

  constructor(routerNavigationService: RouterNavigationService,
    activatedRoute: ActivatedRoute,
    route: Router,
    resourceService: ResourceService, userService: UserService,
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
    this.activatedRoute.parent.params.pipe(mergeMap((params) => {
      this.courseId = params.courseId;
      this.showCreateModal = true;
      this.getSessionDetails();
      this.getBatchDetails();
      return this.fetchBatchDetails();
    }),
      takeUntil(this.unsubscribe))
      .subscribe((data) => {
        this.unitDetails = data.courseDetails.children;
        _.forOwn(this.unitDetails, (courseData: any) => {
          this.getContent(courseData.identifier, courseData);
          this.preContent[courseData.identifier] = this.children;
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
  }
  public getContent(rootId, children) {
    _.forOwn(children.children, child => {
      if (child.hasOwnProperty('children') && child.children.length > 0) {
        this.getContent(rootId, child);
      } else {
        if (child.hasOwnProperty('activityType') && child.activityType === 'live Session') {
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

  public redirect() {
    setTimeout(() => {
      $(document).ready(() => {
          $('#sessionModal').remove();
      });
      this.router.navigate(['./'], { relativeTo: this.activatedRoute.parent });
    }, 1000);
  }

  getBatchDetails() {
    this.courseBatchService.getEnrolledBatchDetails(this.batchId).pipe(
      takeUntil(this.unsubscribe))
      .subscribe((data: ServerResponse) => {
        _.forOwn(data, (batch: any, key) => {
          if (key === 'createdDate') {
            this.batchCreatedDate = batch;
          }
        });
      });

  }
  onUnitChange(event) {
    this.unitChange = true;
    setTimeout(() => {
      this.unitChange = false;
      this.contentChange = true;
      this.disableSubmitBtn = true;
    }, 200);
    if (this.preContent.hasOwnProperty(event)) {
      this.sessionContents = this.preContent[event];
    }
  }
  onContentChange(event) {
    this.contentChange = true;
    setTimeout(() => {
      this.contentChange = false;
      this.disableSubmitBtn = true;
      this.contentDetails = {};
      this.getContentDetails(event);
      console.log(this.contentDetails);
      this.url = this.contentDetails['livesessionurl'];
      this.starttime = this.contentDetails['startTime'];
      this.endtime = this.contentDetails['endTime'];
    }, 200);
  }
  ngAfterViewInit() {
    $('#unit, #content').dropdown();
  }
  update(form: NgForm, content) {
    console.log('Form Submitted', form.value, content);
    const valid_data = this.validationOfForm(form.value);
    if (valid_data) {
      const request = {
        courseId: this.courseId,
        batchId: this.batchId,
        batchCreatedDate: this.batchCreatedDate,
        unitId: form.value.unit,
        contentId: form.value.content,
        livesessionurl: form.value.livesessionurl,
        startTime: form.value.startTime,
        endTime: form.value.endTime
      };
      console.log(request);
      this.liveSessionService.updateSessionDetails(request).subscribe(response => {
        console.log(response);
        this.toasterService.success('Session updated successfully for batch' + this.batchId);
        this.redirect();

      });

    } else {
      this.disableSubmitBtn = true;
        this.toasterService.error('Please enter all valid details');
        this.redirect();

      }
  }
  validationOfForm(formvalues) {
    if (!!this.url && !!this.starttime && !!this.endtime) {
      if ( this.pattern.test(formvalues.livesessionurl) && this.starttime < this.endtime) {
        return true;
      }
    }
    return false;

  }
  public getSessionDetails() {
    this.liveSessionService.getSessionDetails().subscribe(contents => {
      _.forOwn(contents, (content: any) => {
        _.forOwn(content.sessionDetail, (sessions: any) => {
          if (sessions.contentDetails.length > 0) {
            _.forOwn(sessions.contentDetails, (session: any) => {
              console.log(session);
              this.sessionDetails[session.contentId] = session;
            });
          }
        });
      });
    });
  }

  getContentDetails(contentId) {
    if (this.sessionDetails.hasOwnProperty(contentId)) {
      this.contentDetails = this.sessionDetails[contentId];
    } else {
      this.toasterService.error('Sorry this content does not have any Live Session');
    }
  }
  sessionDetailsChanged(inputName, event) {
    if ((inputName === 'url' && event !== '') || (inputName === 'starttime' && event !== '')  ||
    (inputName === 'endtime' && event !== '')) {
      this.disableSubmitBtn = false;
    } else {
      this.disableSubmitBtn = true;
    }
    }
}
