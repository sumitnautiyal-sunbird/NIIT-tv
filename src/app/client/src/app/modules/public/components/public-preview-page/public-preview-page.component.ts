import {map, catchError, first, mergeMap} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PublicPlayerService } from './../../services';
import { Observable ,  Subscription } from 'rxjs';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import {
  WindowScrollService, RouterNavigationService, ILoaderMessage, PlayerConfig,
  ICollectionTreeOptions, NavigationHelperService, ResourceService,  ExternalUrlPreviewService, ConfigService
} from '@sunbird/shared';
import { CollectionHierarchyAPI, ContentService } from '@sunbird/core';
import * as _ from 'lodash';
import { IInteractEventObject, IInteractEventEdata, IImpressionEventInput } from '@sunbird/telemetry';
import { DomSanitizer } from '@angular/platform-browser';
export enum IactivityType {
  'Self Paced' = 'film',
  'live Session' = 'headset',
  'Classroom Session' = 'chalkboard',
  'Assessments' = 'edit',
  'Survey'= 'line-chart',
  'Feedback'= 'comment'
}
@Component({
  selector: 'app-public-preview-page',
  templateUrl: './public-preview-page.component.html',
  styleUrls: ['./public-preview-page.component.scss']
})
export class PublicPreviewPageComponent implements OnInit, OnDestroy {
 /**
	 * telemetryImpression
	*/
  telemetryImpression: IImpressionEventInput;
  public queryParams: any;
  public collectionData: object;

  public route: ActivatedRoute;
  public curriculumactivity = [];
  public showPlayer: Boolean = false;

  private collectionId: string;

  private contentId: string;
  /**
   * Refrence of Content service
   * @private
   * @type {ContentService}
   */
  private contentService: ContentService;

  public collectionTreeNodes: any;

  public collectionTitle: string;

  public contentTitle: string;

  public playerConfig: Observable<any>;

  private playerService: PublicPlayerService;

  private windowScrollService: WindowScrollService;

  private router: Router;

  public loader: Boolean = true;
  public treeModel: any;
  public contentDetails = [];
  public nextPlaylistItem: any;
  public prevPlaylistItem: any;
  public showFooter: Boolean = false;
  public badgeData: Array<object>;
  private subsrciption: Subscription;
  public closeCollectionPlayerInteractEdata: IInteractEventEdata;
  public telemetryInteractObject: IInteractEventObject;
  public loaderMessage: ILoaderMessage = {
    headerMessage: 'Please wait...',
    loaderMessage: 'Fetching content details!'
  };
  public defaultImageSrc = './../../../../../assets/images/default-Course.png';
  previewUrl;
  safeUrl;
  preview = false;
  mimeTypeCount = 0;
  mimeType = '';
  @ViewChild('target') targetEl: ElementRef;
  @ViewChild('top') topEl: ElementRef;
  public curriculum = [];
  public contentIds = [];
userEnrolledBatch;
  collectionTreeOptions: ICollectionTreeOptions;
  /**
	 * dialCode
	*/
  public dialCode: string;
  coursedur: any;
  creatorforcourse: any;

  scroll(el: ElementRef) {
    console.log(el);
    this.targetEl.nativeElement.scrollIntoView({behavior: 'smooth'});
  }
  scrollTop(el: ElementRef) {
    console.log(el);
    this.topEl.nativeElement.scrollIntoView({behavior: 'smooth'});

  }
  constructor(contentService: ContentService, route: ActivatedRoute, playerService: PublicPlayerService,
    windowScrollService: WindowScrollService, router: Router, public navigationHelperService: NavigationHelperService,
    public resourceService: ResourceService, private activatedRoute: ActivatedRoute, private deviceDetectorService: DeviceDetectorService,
    public externalUrlPreviewService: ExternalUrlPreviewService, private configService: ConfigService,
    public sanitizer: DomSanitizer) {
    this.contentService = contentService;
    this.route = route;
    this.playerService = playerService;
    this.windowScrollService = windowScrollService;
    this.router = router;
    this.router.onSameUrlNavigation = 'ignore';
    this.collectionTreeOptions = this.configService.appConfig.collectionTreeOptions;
  }
  ngOnInit() {
if (this.activatedRoute.snapshot.params.hasOwnProperty('batchId')) {
  this.userEnrolledBatch = true;
} else {
  this.userEnrolledBatch = false;
}
console.log(this.activatedRoute, this.userEnrolledBatch);

    this.getContent();
    this.setInteractEventData();
    this.deviceDetector();
  }
  setTelemetryData() {
    this.telemetryImpression = {
      context: {
        env: this.route.snapshot.data.telemetry.env
      },
      object: {
        id: this.collectionId,
        type: 'collection',
        ver: '1.0'
      },
      edata: {
        type: this.route.snapshot.data.telemetry.type,
        pageid: this.route.snapshot.data.telemetry.pageid,
        uri: this.router.url,
        subtype: this.route.snapshot.data.telemetry.subtype
      }
    };
  }

  ngOnDestroy() {
    if (this.subsrciption) {
      this.subsrciption.unsubscribe();
    }
  }

  private initPlayer(id: string): void {
    this.playerConfig = this.getPlayerConfig(id).pipe(catchError((error) => {
      return error;
    }));
  }

  public playContent(data: any): void {
    this.showPlayer = true;
    this.contentTitle = data.title;
    this.initPlayer(data.id);
  }

  private navigateToContent(content?: { title: string, id: string }, id?: string): void {
    let navigationExtras: NavigationExtras;
    navigationExtras = {
      queryParams: {},
      relativeTo: this.route
    };
    if (id) {
      this.queryParams.contentId = id;
      navigationExtras.queryParams = this.queryParams;
    } else
      if (content) {
        navigationExtras.queryParams = { 'contentId': content.id };
      }
    this.router.navigate([], navigationExtras);
  }

  private getPlayerConfig(contentId: string): Observable<PlayerConfig> {
    if (this.dialCode) {
      return this.playerService.getConfigByContent(contentId, { dialCode: this.dialCode });
    } else {
      return this.playerService.getConfigByContent(contentId);
    }
  }

  private findContentById(collection: any, id: string) {
    const model = new TreeModel();
    return model.parse(collection.data).first((node) => {
      return node.model.identifier === id;
    });
  }
  private parseChildContent(collection: any) {
    const model = new TreeModel();
    const mimeTypeCount = {};
    const activityTypeCount = {};
    this.coursedur=collection.data.courseduration;
    this.creatorforcourse=collection.data.creator;
    debugger;
    if (collection.data) {
      this.treeModel = model.parse(collection.data);
      this.treeModel.walk((node) => {
        if (node.model.activityType) {
          if (activityTypeCount[node.model.activityType]) {
            activityTypeCount[node.model.activityType] += 1;
          } else {
            activityTypeCount[node.model.activityType] = 1;
          }
        }
        if (node.model.mimeType !== 'application/vnd.ekstep.content-collection') {
          if (mimeTypeCount[node.model.mimeType]) {
            mimeTypeCount[node.model.mimeType] += 1;
            this.mimeTypeCount++;
            console.log(_.includes(node.model.mimeType, '.epub'));
            if (!_.includes(node.model.mimeType, 'archive') && !_.includes(node.model.mimeType, 'epub')) {
              this.previewUrl = node.model;
              console.log(this.previewUrl);
             }
          } else {
            console.log(_.includes(node.model.mimeType, '.epub'));

            if (!_.includes(node.model.mimeType, 'archive') && !_.includes(node.model.mimeType, 'epub')) {
              this.previewUrl = node.model;
              console.log(this.previewUrl);
             }
           this.mimeTypeCount++;
            mimeTypeCount[node.model.mimeType] = 1;
          }
          this.contentDetails.push({ id: node.model.identifier, title: node.model.name });
          this.contentIds.push(node.model.identifier);
        }
      });
      _.forEach(mimeTypeCount, (value, key) => {
        let mime;
        this.curriculum.push({ mimeType: key, count: value });
       if (key === 'video/mp4' || 'video/x-youtube' ||  'video/mp4' || 'video/webm') {
         mime = 'video';
       }
       this.mimeType = this.mimeType + ' ' + mime + ' ' + value;
        console.log(this.mimeType);
      });
      _.forEach(activityTypeCount, (value, key) => {
        this.curriculumactivity.push({
          activityType: key,
          count: value,
          activityTypeIcon: IactivityType[key]
        });
      });
      //   if (node.model.mimeType !== 'application/vnd.ekstep.content-collection') {
      //     this.contentDetails.push({ id: node.model.identifier, title: node.model.name });
      //   }
      //   this.setContentNavigators();
      // });
    }
  }
  public setContentNavigators() {
    const index = _.findIndex(this.contentDetails, ['id', this.contentId]);
    this.prevPlaylistItem = this.contentDetails[index - 1];
    this.nextPlaylistItem = this.contentDetails[index + 1];
  }
  public OnPlayContent(content: { title: string, id: string }, isClicked?: boolean) {
    this.preview = false;
    if (content && content.id) {
      this.navigateToContent(null, content.id);
      this.setContentNavigators();
      this.playContent(content);
      if (!isClicked) {
        const playContentDetails = this.findContentById( this.collectionTreeNodes, content.id);
        if (playContentDetails.model.mimeType === this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.xUrl) {
          this.externalUrlPreviewService.generateRedirectUrl(playContentDetails.model);
        }
      }
        this.windowScrollService.smoothScroll('app-player-collection-renderer', 10);
    } else {
      throw new Error(`unbale to play collection content for ${this.collectionId}`);
    }
  }

  private getContent(): void {
    this.subsrciption = this.route.params.pipe(
      first(),
      mergeMap((params) => {
        this.collectionId = params.collectionId;
        console.log(this.collectionId);
        this.setTelemetryData();
        return this.getCollectionHierarchy(params.collectionId);
      }), )
      .subscribe((data) => {
        this.collectionTreeNodes = data;
        this.loader = false;
        this.route.queryParams.subscribe((queryParams) => {
          this.queryParams = { ...queryParams};
          this.contentId = queryParams.contentId;
          this.dialCode = queryParams.dialCode;
          if (this.contentId) {
            const content = this.findContentById(data, this.contentId);
            if (content) {
              this.OnPlayContent({ title: _.get(content, 'model.name'), id: _.get(content, 'model.identifier') }, true);
            } else {
              // show toaster error
            }
          } else {
            this.closeContentPlayer();
          }
        });
        this.parseChildContent(this.collectionTreeNodes);
      }, (error) => {
        // toaster error
      });
  }

  private getCollectionHierarchy(collectionId: string): Observable<{ data: CollectionHierarchyAPI.Content }> {
    const inputParams = {params: this.configService.appConfig.CourseConsumption.contentApiQueryParams};
    return this.playerService.getCollectionHierarchy(collectionId, inputParams).pipe(
      map((response) => {
        this.collectionData = response.result.content;
        console.log(this.collectionData);
        this.collectionTitle = _.get(response, 'result.content.name') || 'Untitled Collection';
        this.badgeData = _.get(response, 'result.content.badgeAssertions');
        return { data: response.result.content };
      }));
  }
  closeCollectionPlayer() {
    this.navigationHelperService.navigateToPreviousUrl('/explore');
  }
  closeContentPlayer() {
    this.showPlayer = false;
    delete this.queryParams.contentId;
    const navigationExtras: NavigationExtras = {
      relativeTo: this.route,
      queryParams: this.queryParams
    };
    this.router.navigate([], navigationExtras);
  }
  setInteractEventData() {
    this.closeCollectionPlayerInteractEdata = {
      id: 'close-collection',
      type: 'click',
      pageid: 'public'
    };
    this.telemetryInteractObject = {
      id: this.activatedRoute.snapshot.params.collectionId,
      type: 'collection',
      ver: '1.0'
    };
  }
  deviceDetector() {
    const deviceInfo = this.deviceDetectorService.getDeviceInfo();
    if ( deviceInfo.device === 'android' || deviceInfo.os === 'android') {
      this.showFooter = true;
    }
  }

  // redirect() {
  //   this.router.navigate(['/learn/course', this.courseId]);
  // }

  showPreviewVideo() {
    console.log(this.previewUrl);
    this.preview = !this.preview;
    let showUrl;
    const url = this.previewUrl.artifactUrl.slice(17);
    if (this.previewUrl.mimeType === 'video/x-youtube') {
      console.log(_.includes(this.previewUrl.artifactUrl, 'watch'));
      if (_.includes(this.previewUrl.artifactUrl, 'watch')) {
        showUrl = this.previewUrl.artifactUrl.replace('watch?v=', 'embed/');
        console.log(showUrl);
      } else if (_.includes(this.previewUrl.artifactUrl, 'embed')) {
        showUrl = this.previewUrl.artifactUrl;
      } else {
        showUrl = 'https://www.youtube.com/embed/' + url;
        console.log(showUrl);
      }
    } else {
      showUrl = this.previewUrl.artifactUrl;
      console.log(showUrl);
    }
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(showUrl);
  }
}


