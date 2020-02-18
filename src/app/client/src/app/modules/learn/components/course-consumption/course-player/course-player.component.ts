import { combineLatest, Subject } from 'rxjs';
import { takeUntil, first, mergeMap, map } from 'rxjs/operators';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import {
  UserService,
  BreadcrumbsService,
  PermissionService,
  CoursesService
} from '@sunbird/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import * as _ from 'lodash';
import {
  WindowScrollService,
  ILoaderMessage,
  ConfigService,
  ICollectionTreeOptions,
  NavigationHelperService,
  ToasterService,
  ResourceService,
  ExternalUrlPreviewService
} from '@sunbird/shared';
import {
  CourseConsumptionService,
  CourseBatchService,
  CourseProgressService
} from './../../../services';
import { INoteData } from '@sunbird/notes';
import {
  IImpressionEventInput,
  IEndEventInput,
  IStartEventInput,
  IInteractEventObject,
  IInteractEventEdata
} from '@sunbird/telemetry';
import { DeviceDetectorService } from 'ngx-device-detector';
import { PublicDataService, LearnerService } from '@sunbird/core';
import { DomSanitizer } from '@angular/platform-browser';
import { IUserData } from '../../../../shared';
import { Subscription } from 'rxjs';
import { SubscriptionLike as ISubscription } from 'rxjs';
import { debug } from 'util';
import { ChildcontentdetailsService } from '../../../../shared/services/childcontentdetails/childcontentdetails.service';
import { PlayresourceService } from '../../../../shared/services/playresource/playresource.service';
export enum IactivityType {
  'Self Paced' = 'film',
  'live Session' = 'headset',
  'Classroom Session' = 'chalkboard',
  'Assessments' = 'edit',
  'Survey'= 'line-chart',
  'Feedback'= 'comment'
}
declare var $: any;

@Component({
  selector: 'app-course-player',
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.scss']
})
export class CoursePlayerComponent implements OnInit, OnDestroy, AfterViewInit {
  public courseInteractObject: IInteractEventObject;

  public contentInteractObject: IInteractEventObject;

  public closeContentIntractEdata: IInteractEventEdata;

  private courseId: string;

  public batchId: string;

  public enrolledCourse = false;

  public contentId: string;

  public courseStatus: string;

  public flaggedCourse = false;

  public collectionTreeNodes: any;

  public contentTitle: string;

  public playerConfig: any;

  public loader = true;

  public showError = false;

  public enableContentPlayer = false;

  public courseHierarchy: any;

  public readMore = false;
  public contentreadMore = false;

  public createNoteData: INoteData;

  public curriculum = [];
  public curriculumactivity = [];

  public istrustedClickXurl = false;

  public showNoteEditor = false;

  public telemetryCourseImpression: IImpressionEventInput;

  public telemetryContentImpression: IImpressionEventInput;

  public telemetryCourseEndEvent: IEndEventInput;

  public telemetryCourseStart: IStartEventInput;

  public contentIds = [];

  public courseProgressData: any;

  public contentStatus: any;

  public contentDetails = [];

  public enrolledBatchInfo: any;

  public treeModel: any;

  public nextPlaylistItem: any;

  public prevPlaylistItem: any;

  public contributions: any;

  public noContentToPlay = 'No content to play';

  public defaultImageSrc = './../../../../../../assets/images/book.png';

  public showExtContentMsg = false;
  openFeedbackModal = false;
  courseDetails = [];
  resources = [];
  creator;
  batchDetails = [];
  enrolledCourses = [];
  courseDescription;
  unEnroll = false;
  showPromo = true;
  userRoles = false;
  courseTitle;
  userEnrolledBatch = false;
  creatorFor = [];
  courseIds = [];
  firstPreviewUrl;
  courseInfo;
  showPreview: boolean;
  public loaderMessage: ILoaderMessage = {
    headerMessage: 'Please wait...',
    loaderMessage: 'Fetching content details!'
  };
  public disable_jumbotron = false;
  showJumbotron = true;
  public previewContentRoles = [
    'COURSE_MENTOR',
    'CONTENT_REVIEWER',
    'CONTENT_CREATOR',
    'CONTENT_CREATION',
    'PUBLIC'
  ];

  public collectionTreeOptions: ICollectionTreeOptions;

  public unsubscribe = new Subject<void>();
  previewUrl;
  safeUrl;
  preview = false;
  mimeTypeCount = 0;
  mimeType = '';
  enrolledDate: any;
  isEnrolled = false;
  isLoggedIn = false;
  userName: any;
  userSubscription: ISubscription;
  @ViewChild('target') targetEl: ElementRef;
  @ViewChild('top') topEl: ElementRef;
  c = 0;
  enddate: number;
  totallearners: number =0;
  scroll(el: ElementRef) {
    this.targetEl.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
  scrollTop(el: ElementRef) {
    this.topEl.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
  constructor(
    public activatedRoute: ActivatedRoute,
    private configService: ConfigService,
    private courseConsumptionService: CourseConsumptionService,
    public windowScrollService: WindowScrollService,
    public router: Router,
    public navigationHelperService: NavigationHelperService,
    private userService: UserService,
    private toasterService: ToasterService,
    private resourceService: ResourceService,
    public breadcrumbsService: BreadcrumbsService,
    private cdr: ChangeDetectorRef,
    public courseBatchService: CourseBatchService,
    public permissionService: PermissionService,
    public externalUrlPreviewService: ExternalUrlPreviewService,
    public coursesService: CoursesService,
    private courseProgressService: CourseProgressService,
    private deviceDetectorService: DeviceDetectorService,
    public publicDataService: PublicDataService,
    public learnerService: LearnerService,
    public sanitizer: DomSanitizer,
    public route: Router,
    public childContentDetails: ChildcontentdetailsService,
    public playResource: PlayresourceService
  ) {
    this.router.onSameUrlNavigation = 'ignore';
    this.collectionTreeOptions = this.configService.appConfig.collectionTreeOptions;
  }
  ngOnInit() {
      this.userSubscription = this.userService.userData$.subscribe(
      (user: IUserData) => {
        console.log('user infoe', user.userProfile.firstName);
        if (user && !user.err) {
          this.userName = user.userProfile.firstName;
        }
      });
    if (this.userService.loggedIn) {
      this.isLoggedIn = true;
    }
    console.log('this.activatedroute', this.activatedRoute.snapshot.params.enrolledDate);
    this.activatedRoute.params
      .pipe(
        first(),
        mergeMap(({ courseId, batchId, courseStatus }) => {
          this.courseId = courseId;
          this.batchId = batchId;
          this.courseStatus = courseStatus;
          this.setTelemetryCourseImpression();

          if (this.batchId) {
            this.isEnrolled = true;
            this.userEnrolledBatch = true;
            this.enrolledDate = this.activatedRoute.snapshot.params.enrolledDate;
            console.log('batch id', this.isEnrolled, this.isLoggedIn, this.batchId, this.courseId);
          }

          const inputParams = {
            params: this.configService.appConfig.CourseConsumption
              .contentApiQueryParams
          };
          if (this.batchId) {
            return combineLatest(
              this.courseConsumptionService.getCourseHierarchy(
                courseId,
                inputParams
              ),
              this.courseBatchService.getEnrolledBatchDetails(this.batchId)
            ).pipe(
              map(results => ({
                courseHierarchy: results[0],
                enrolledBatchDetails: results[1]
              }))
            );
          }
          return this.courseConsumptionService
            .getCourseHierarchy(courseId, inputParams)
            .pipe(map(courseHierarchy => ({ courseHierarchy })));
        })
      )
      .subscribe(
        ({ courseHierarchy, enrolledBatchDetails }: any) => {
          this.courseHierarchy = courseHierarchy;
          console.log('this is course hierarchy for logged in course', this.courseHierarchy);
          this.contributions = _.join(
            _.map(this.courseHierarchy.contentCredits, 'name')
          );
          this.courseInteractObject = {
            id: this.courseHierarchy.identifier,
            type: 'Course',
            ver: this.courseHierarchy.pkgVersion
              ? this.courseHierarchy.pkgVersion.toString()
              : '1.0'
          };
          if (this.courseHierarchy.status === 'Flagged') {
            this.flaggedCourse = true;
          }
          this.parseChildContent();
          console.log('child details' , this.contentDetails);
          this.childContentDetails.childrenContentDetails.next(this.contentDetails);
          if (this.batchId) {
            this.enrolledBatchInfo = enrolledBatchDetails;
            console.log(this.enrolledBatchInfo);
            // debugger;
            this.enrolledCourse = true;
            this.setTelemetryStartEndData();
            if (this.enrolledBatchInfo.status && this.contentIds.length) {
              this.getContentState();
              this.subscribeToQueryParam();
            }
          } else if (
            this.courseStatus === 'Unlisted' ||
            this.permissionService.checkRolesPermissions(
              this.previewContentRoles
            ) ||
            this.courseHierarchy.createdBy === this.userService.userid
          ) {
            this.subscribeToQueryParam();
          }
          this.collectionTreeNodes = {
            data: this.courseHierarchy,
            enrolldata: this.enrolledBatchInfo
          };
          this.loader = false;
        },
        error => {
          this.loader = false;
          this.toasterService.error(this.resourceService.messages.emsg.m0005); // need to change message
        }
      );
    this.courseProgressService.courseProgressData
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        courseProgressData => (this.courseProgressData = courseProgressData)
      );
    this.courseBatchService.getAllBatchDetails({ 'filters': { 'courseId': this.courseId } }).subscribe((data) => {
      let coursebatches = data.result.response.content;
      for (let i = 0; i < coursebatches.length; i++) {
        if (!!coursebatches[i].participant && !!Object.keys(coursebatches[i].participant).length) {
          Object.keys(coursebatches[i].participant).forEach((key) => {
            if (coursebatches[i].participant[key] === true) {
              this.totallearners += 1;               // Calculate total learners
            }
          });
        }
      }
    });
this.playResource.playresource.subscribe( (obj) => {
  if (obj.flag) {
    this.navigateToContent(obj.content);
  }
});
  }
  ngAfterViewInit() {
    console.log(this.showJumbotron);
  }
  private parseChildContent() {
    const model = new TreeModel();
    const mimeTypeCount = {};
    const activityTypeCount = {};
    console.log(this.courseHierarchy);
    this.treeModel = model.parse(this.courseHierarchy);
    this.treeModel.walk(node => {
      if (node.model.activityType) {
        if (node.model.activityType === 'live Session') {
          this.c++;
        }
        if (activityTypeCount[node.model.activityType]) {
          activityTypeCount[node.model.activityType] += 1;
        } else {
          activityTypeCount[node.model.activityType] = 1;
        }
      } else if (
        node.model.mimeType === 'video/mp4' ||
        node.model.mimeType === 'video/x-youtube' ||
        node.model.mimeType === 'video/mp4' ||
        node.model.mimeType === 'video/webm' ||
        node.model.mimeType === 'application/pdf'
      ) {
        if (activityTypeCount['Self Paced']) {
          activityTypeCount['Self Paced'] += 1;
        } else {
          activityTypeCount['Self Paced'] = 1;
        }
      }


      if (node.model.mimeType !== 'application/vnd.ekstep.content-collection') {
        // debugger;

        if (mimeTypeCount[node.model.mimeType]) {
          mimeTypeCount[node.model.mimeType] += 1;
          this.mimeTypeCount++;
          if (
            !_.includes(node.model.mimeType, 'archive') &&
            !_.includes(node.model.mimeType, 'epub')
          ) {
            this.previewUrl = node.model;
          }
        } else {
          if (
            !_.includes(node.model.mimeType, 'archive') &&
            !_.includes(node.model.mimeType, 'epub')
          ) {
            this.previewUrl = node.model;
          }
          this.mimeTypeCount++;
          mimeTypeCount[node.model.mimeType] = 1;
        }
        this.contentDetails.push({
          id: node.model.identifier,
          title: node.model.name
        });
        this.contentIds.push(node.model.identifier);
      }
    });
    _.forEach(mimeTypeCount, (value, key) => {
      let mime;
      this.curriculum.push({ mimeType: key, count: value });
      if (
        key === 'video/mp4' ||
        'video/x-youtube' ||
        'video/mp4' ||
        'video/webm'
      ) {
        mime = 'video';
      }
      this.mimeType = this.mimeType + ' ' + mime + ' ' + value;
    });
    _.forEach(activityTypeCount, (value, key) => {
      this.curriculumactivity.push({
        activityType: key,
        count: value,
        activityTypeIcon: IactivityType[key]
      });
    });

    if (this.c > 0) {
      this.newFlag(1);
    } else {
      this.newFlag(0);
    }
  }
  newFlag(f) {
    this.resourceService.changeflag(f);
  }
  private getContentState() {
    const req = {
      userId: this.userService.userid,
      courseId: this.courseId,
      contentIds: this.contentIds,
      batchId: this.batchId
    };
    combineLatest(this.courseBatchService.getAllBatchDetails({ 'filters': { 'id': req.batchId, 'courseId': req.courseId } }),
    this.courseConsumptionService
      .getContentState(req)
      .pipe(first())).subscribe((data) => {
console.log('Combine latest data', data);
      const batchenddate = data[0]['result'].response.content[0].endDate;
      if (batchenddate) {
      this.enddate = Date.parse(batchenddate);
      const course_batchid = this.courseId + '_' + this.batchId;
      this.contentStatus = data[1].content;
       this.courseProgressService.updatedetails(data[1], course_batchid, this.enddate);
      }

    });

  }
  private subscribeToQueryParam() {
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(({ contentId }) => {
        if (contentId) {
          const content = this.findContentById(contentId);
          const isExtContentMsg = this.coursesService.showExtContentMsg
            ? this.coursesService.showExtContentMsg
            : false;
          if (content) {
            this.OnPlayContent(
              {
                title: _.get(content, 'model.name'),
                id: _.get(content, 'model.identifier')
              },
              isExtContentMsg
            );
          } else {
            this.toasterService.error(this.resourceService.messages.emsg.m0005); // need to change message
            this.closeContentPlayer();
          }
        } else {
          this.closeContentPlayer();
        }
      });
  }
  public findContentById(id: string) {
    return this.treeModel.first(node => node.model.identifier === id);
  }
  private OnPlayContent(
    content: { title: string; id: string },
    showExtContentMsg?: boolean
  ) {
    if (
      content &&
      content.id &&
      ((this.enrolledCourse &&
        !this.flaggedCourse &&
        this.enrolledBatchInfo.status > 0) ||
        this.courseStatus === 'Unlisted' ||
        this.permissionService.checkRolesPermissions(
          this.previewContentRoles
        ) ||
        this.courseHierarchy.createdBy === this.userService.userid)
    ) {
      this.contentId = content.id;
      this.setTelemetryContentImpression();
      this.setContentNavigators();
      this.playContent(content, showExtContentMsg);
    } else {
      this.closeContentPlayer();
    }
  }
  private setContentNavigators() {
    const index = _.findIndex(this.contentDetails, ['id', this.contentId]);
    this.prevPlaylistItem = this.contentDetails[index - 1];
    this.nextPlaylistItem = this.contentDetails[index + 1];
  }
  private playContent(data: any, showExtContentMsg?: boolean): void {
    // console.log(data);
    this.enableContentPlayer = false;
    this.disable_jumbotron = false;
    this.loader = true;
    const options: any = { courseId: this.courseId };
    if (this.batchId) {
      options.batchHashTagId = this.enrolledBatchInfo.hashTagId;
    }
    this.courseConsumptionService
      .getConfigByContent(data.id, options)
      .pipe(first())
      .subscribe(
        config => {
          this.setContentInteractData(config);
          this.loader = false;
          this.playerConfig = config;
          if (
            (config.metadata.mimeType ===
              this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.xUrl &&
              !this.istrustedClickXurl) ||
            (config.metadata.mimeType ===
              this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.xUrl &&
              showExtContentMsg)
          ) {
            setTimeout(() => (this.showExtContentMsg = true), 100);
          } else {
            this.showExtContentMsg = false;
          }
          this.enableContentPlayer = true;
          // this.loader = false;
          this.contentTitle = data.title;
          this.breadcrumbsService.setBreadcrumbs([
            { label: this.contentTitle, url: '' }
          ]);
          this.windowScrollService.smoothScroll(
            'app-player-collection-renderer',
            500
          );
        },
        err => {
          this.loader = false;
          this.toasterService.error(this.resourceService.messages.stmsg.m0009);
        }
      );
  }

  public updateFeedback(toShow) {
    if (toShow !== undefined) {
      this.openFeedbackModal = toShow;
    }
  }
  public navigateToContent(content: { title: string; id: string }): void {
    this.disable_jumbotron = true;
    const navigationExtras: NavigationExtras = {
      queryParams: { contentId: content.id },
      relativeTo: this.activatedRoute
    };
    const playContentDetail = this.findContentById(content.id);
    if (
      playContentDetail.model.mimeType ===
      this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.xUrl
    ) {
      this.showExtContentMsg = false;
      this.istrustedClickXurl = true;
      this.externalUrlPreviewService.generateRedirectUrl(
        playContentDetail.model,
        this.userService.userid,
        this.courseId,
        this.batchId
      );
    }
    if (this.enrolledDate) {
      if (
        (this.batchId && !this.flaggedCourse && this.enrolledBatchInfo.status) || this.courseStatus === 'Unlisted' ||
        this.permissionService.checkRolesPermissions(this.previewContentRoles) ||
        this.courseHierarchy.createdBy === this.userService.userid && this.userEnrolledBatch
      ) {
// tslint:disable-next-line: max-line-length
        this.route.navigate(['/learn/play/batch', this.batchId, 'course', this.courseId,
        {
          enrolledDate: this.enrolledDate,
          userEnrolledBatch: this.userEnrolledBatch,
          userName: this.userName,
          isEnrolled: this.isEnrolled,
          isLoggedIn: this.isLoggedIn
        }
      ],
         navigationExtras);
        this.enableContentPlayer = false;


      }
    } else {
      if (
        (this.batchId && !this.flaggedCourse && this.enrolledBatchInfo.status) || this.courseStatus === 'Unlisted' ||
        this.permissionService.checkRolesPermissions(this.previewContentRoles) ||
        this.courseHierarchy.createdBy === this.userService.userid && this.userEnrolledBatch
      ) {
        this.router.navigate([], navigationExtras);
        this.enableContentPlayer = false;
      }
    }
  }
  public contentProgressEvent(event) {
    /* console.log(
      'recieved content progress event fro the content player ',
      event
    ); */
    //  if (!this.batchId || _.get(this.enrolledBatchInfo, 'status') !== 1) {
    //   return;
    // }
    const eid = event.detail.telemetryData.eid;
    if (eid === 'END' && !this.validEndEvent(event)) {
      return;
    }
    const request: any = {
      userId: this.userService.userid,
      contentId: this.contentId,
      courseId: this.courseId,
      batchId: this.batchId,
      status: eid === 'END' ? 2 : 1
    };
    this.courseConsumptionService
      .updateContentsState(request)
      .pipe(first())
      .subscribe(
        updatedRes => (this.contentStatus = updatedRes.content),
        err => console.log('updating content status failed', err)
      );
  }
  private validEndEvent(event) {
    const playerSummary: Array<any> = _.get(
      event,
      'detail.telemetryData.edata.summary'
    );
    const contentMimeType = _.get(
      this.findContentById(this.contentId),
      'model.mimeType'
    );
    const validSummary = (summaryList: Array<any>) => (percentage: number) =>
      _.find(
        summaryList,
        (requiredProgress => summary =>
          summary && summary.progress >= requiredProgress)(percentage)
      );
    if (
      validSummary(playerSummary)(20) &&
      ['video/x-youtube', 'video/mp4', 'video/webm'].includes(contentMimeType)
    ) {
      return true;
    } else if (
      validSummary(playerSummary)(0) &&
      [
        'application/vnd.ekstep.h5p-archive',
        'application/vnd.ekstep.html-archive'
      ].includes(contentMimeType)
    ) {
      return true;
    } else if (validSummary(playerSummary)(100)) {
      return true;
    }
    return false;
  }
  public closeContentPlayer() {
    this.disable_jumbotron = true;
    this.cdr.detectChanges();
    if (this.enableContentPlayer === true) {
      const navigationExtras: NavigationExtras = {
        relativeTo: this.activatedRoute
      };
      this.enableContentPlayer = false;
      this.router.navigate([], navigationExtras);
    }
  }
  public createEventEmitter(data) {
    this.createNoteData = data;
  }
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
  private setTelemetryStartEndData() {
    const deviceInfo = this.deviceDetectorService.getDeviceInfo();
    this.telemetryCourseStart = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      object: {
        id: this.courseId,
        type: this.activatedRoute.snapshot.data.telemetry.object.type,
        ver: this.activatedRoute.snapshot.data.telemetry.object.ver
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        mode: 'play',
        uaspec: {
          agent: deviceInfo.browser,
          ver: deviceInfo.browser_version,
          system: deviceInfo.os_version,
          platform: deviceInfo.os,
          raw: deviceInfo.userAgent
        }
      }
    };
    this.telemetryCourseEndEvent = {
      object: {
        id: this.courseId,
        type: this.activatedRoute.snapshot.data.telemetry.object.type,
        ver: this.activatedRoute.snapshot.data.telemetry.object.ver
      },
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        mode: 'play'
      }
    };
  }
  private setTelemetryCourseImpression() {
    this.telemetryCourseImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url
      },
      object: {
        id: this.courseId,
        type: 'course',
        ver: '1.0'
      }
    };
  }
  private setTelemetryContentImpression() {
    this.telemetryContentImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url
      },
      object: {
        id: this.contentId,
        type: 'content',
        ver: '1.0',
        rollup: {
          l1: this.courseId,
          l2: this.contentId
        }
      }
    };
  }
  private setContentInteractData(config) {
    this.contentInteractObject = {
      id: config.metadata.identifier,
      type:
        config.metadata.contentType ||
        config.metadata.resourceType ||
        'content',
      ver: config.metadata.pkgVersion
        ? config.metadata.pkgVersion.toString()
        : '1.0',
      rollup: { l1: this.courseId }
    };
    this.closeContentIntractEdata = {
      id: 'content-close',
      type: 'click',
      pageid: 'course-consumption'
    };
  }
  /* toggleSidebar() {
    $('.videoSidebar').sidebar('setting', 'transition', 'overlay').sidebar('toggle');
  } */
  showPreviewVideo() {
    this.preview = !this.preview;
    let showUrl;
    const url = this.previewUrl.artifactUrl.slice(17);
    if (this.previewUrl.mimeType === 'video/x-youtube') {
      if (_.includes(this.previewUrl.artifactUrl, 'watch')) {
        showUrl = this.previewUrl.artifactUrl.replace('watch?v=', 'embed/');
      } else if (_.includes(this.previewUrl.artifactUrl, 'embed')) {
        showUrl = this.previewUrl.artifactUrl;
      } else {
        showUrl = 'https://www.youtube.com/embed/' + url;
      }
    } else {
      showUrl = this.previewUrl.artifactUrl;
    }
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(showUrl);
  }
}
