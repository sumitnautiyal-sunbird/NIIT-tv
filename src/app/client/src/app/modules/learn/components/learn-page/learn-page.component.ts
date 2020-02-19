import { combineLatest, of, Subject, Subscription } from 'rxjs';
import { PageApiService, CoursesService, ISort, PlayerService, FormService, UserService } from '@sunbird/core';
import { Component, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import {
  ResourceService, ServerResponse, ToasterService, ICaraouselData, ConfigService, UtilService, INoResultMessage, BrowserCacheTtlService,
  IUserData
} from '@sunbird/shared';
import { CookieManagerService } from '../../../shared/services/cookie-manager/cookie-manager.service';
import * as _ from 'lodash';
import { Router, ActivatedRoute } from '@angular/router';
import { IInteractEventEdata, IImpressionEventInput } from '@sunbird/telemetry';
import { CacheService } from 'ng2-cache-service';
import { takeUntil, map, mergeMap, first, filter, catchError } from 'rxjs/operators';
import { EnrolledcontentService } from '../../../shared/services/enrolledcontent/enrolledcontent.service';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  templateUrl: './learn-page.component.html',
  styleUrls: ['./learn-page.component.scss']
})
export class LearnPageComponent implements OnInit, OnDestroy {
  public showLoader = true;
  public noResultMessage: INoResultMessage;
  public carouselData: Array<ICaraouselData> = [];
  public filterType: string;
  public queryParams: any;
  public hashTagId: string;
  public unsubscribe$ = new Subject<void>();
  public telemetryImpression: IImpressionEventInput;
  public inViewLogs = [];
  public sortIntractEdata: IInteractEventEdata;
  public dataDrivenFilters: any = {};
  public dataDrivenFilterEvent = new EventEmitter();
  public frameWorkName: string;
  public initFilters = false;
  public userDataSubscription: Subscription;
  public userRecommendationObject: any;
  public loaderMessage;
  public sortingOptions: ISort;
  public enrolledSection: any;
  public redirectUrl: string;
  public homeConfig: object;
  public  organisationName: any;
  public organisationIDs: any;
  enrolledIDs: any;
  enrolledLoader = true;
  trainerModal = false;
  bestTrainerUrl: any;
  constructor(private pageApiService: PageApiService, private toasterService: ToasterService,
    public resourceService: ResourceService, private configService: ConfigService, private activatedRoute: ActivatedRoute,
    public router: Router, private utilService: UtilService, public coursesService: CoursesService,
    private playerService: PlayerService, private cacheService: CacheService,
    private browserCacheTtlService: BrowserCacheTtlService, public formService: FormService,
    private userSrvc: UserService, private cookieSrvc: CookieManagerService , public enrolledContentList: EnrolledcontentService,
    private sanitizer: DomSanitizer) {
    this.redirectUrl = this.configService.appConfig.courses.inPageredirectUrl;
    this.filterType = this.configService.appConfig.courses.filterType;
    this.sortingOptions = this.configService.dropDownConfig.FILTER.RESOURCES.sortingOptions;
    this.setTelemetryData();
  }
  ngOnInit() {

    this.userDataSubscription = this.userSrvc.userData$.subscribe(
      (user: IUserData) => {
        if (user && !user.err) {
          this.userRecommendationObject = user.userProfile.framework;
          this.organisationName = user.userProfile.organisations;
          this.userRecommendationObject['framework'] = this.userRecommendationObject['id'];
          delete this.userRecommendationObject['framework']['id'];
        }
      });
    combineLatest(this.fetchEnrolledCoursesSection(), this.getFrameWork()).pipe(first(),
      mergeMap((data: Array<any>) => {
        this.enrolledSection = data[0];
        // console.log('enrolled section is ', this.enrolledSection);
        // pull out all the course IDs for filteration in the courseRecommendation section
        this.enrolledIDs = [];
        this.enrolledIDs = this.enrolledSection.contents.map(content => {
          // console.log('returning ', content.metaData.courseId);
          return content.metaData.courseId;
        });
        // console.log('ENROLLED IDS ARE ', this.enrolledIDs);
        if (data[1]) {
          this.initFilters = true;
          this.frameWorkName = data[1];
          // return this.dataDrivenFilterEvent;
          return of({});
        } else {
          return of({});
        }
      })).subscribe((filters: any) => {
        this.dataDrivenFilters = filters;
        this.fetchContentOnParamChange();
        this.setNoResultMessage();
      },
        error => {
          this.toasterService.error(this.resourceService.messages.fmsg.m0002);
        });
  }
  private fetchContentOnParamChange() {
    combineLatest(this.activatedRoute.params, this.activatedRoute.queryParams)
      .pipe(map((result) => ({ params: result[0], queryParams: result[1] })),
        filter(({ queryParams }) => !_.isEqual(this.queryParams, queryParams)), // fetch data if queryParams changed
        takeUntil(this.unsubscribe$))
      .subscribe(({ params, queryParams }) => {
        this.showLoader = true;
        this.queryParams = { ...queryParams };
        this.carouselData = [];
        this.fetchPageData();
      });
  }
  private fetchPageData() {
    const filters = _.pickBy(this.queryParams, (value: Array<string> | string, key) => {
      if (_.includes(['sort_by', 'sortType', 'appliedFilters'], key)) {
        return false;
      }
      return value.length;
    });
    // filters.channel = this.hashTagId;
    // filters.board = _.get(this.queryParams, 'board') || this.dataDrivenFilters.board;
    const option: any = {
      source: 'web',
      name: 'Course',
      filters: filters,
      // softConstraints: { badgeAssertions: 98, board: 99,  channel: 100 },
      // mode: 'soft',
      // exists: [],
      params: this.configService.appConfig.CoursePageSection.contentApiQueryParams
    };
    // populate the organisation id of each organisation
    this.organisationIDs = this.organisationName.map(org => {
      return org.organisationId;
    });
    // populate organisation names of logged in user
    this.organisationName = this.organisationName.map(org => {
      return org.orgName;
    });
    option.filters = {...filters , 'organisation': this.organisationName, 'channel': this.organisationIDs};
    if (this.queryParams.sort_by) {
      option.sort_by = { [this.queryParams.sort_by]: this.queryParams.sortType };
    }
    this.pageApiService.getPageData(option).pipe(takeUntil(this.unsubscribe$))
      .subscribe(data => {
        // console.log('PAGE API DATA IS ', data);
        this.showLoader = false;
        this.carouselData = this.prepareCarouselData(_.get(data, 'sections'));
        // console.log("PREPARED CAROUEL DATA ", this.carouselData);
        this.carouselData = this.carouselData.filter(carouseldata => carouseldata.name === 'Latest Courses');
        // console.log("FILTERED CAROUSLE DATA ", this.carouselData);
        // filter all the courses which are not enrolled
        if (this.enrolledIDs.length > 0) {
          this.carouselData['0']['contents'] = this.carouselData['0']['contents'].filter(content => {
            if (!content.metaData.hasOwnProperty('batchId')) {
              // console.log('filtered ', content.name);
              return content;
            }
          });
          // console.log('updated carouselData is ', this.carouselData);
        }
      }, err => {
        this.showLoader = false;
        this.carouselData = [];
        this.toasterService.error(this.resourceService.messages.fmsg.m0002);
      });
  }
  private prepareCarouselData(sections = []) {
    const { constantData, metaData, dynamicFields, slickSize } = this.configService.appConfig.CoursePageSection.course;
    const carouselData = _.reduce(sections, (collector, element) => {
      const contents = _.slice(_.get(element, 'contents'), 0, slickSize) || [];
      element.contents = _.map(contents, (content: any) => {
        const enrolledContent = _.find(this.enrolledSection.contents,
          (enrolledCourse) => (enrolledCourse.metaData.courseId === content.identifier));
        return enrolledContent ||
          this.utilService.processContent(content, constantData, dynamicFields, metaData);
      });
      if (element.contents && element.contents.length) {
        collector.push(element);
      }
      return collector;
    }, []);
    return carouselData;
  }
  public getFilters(filters) {
    const defaultFilters = _.reduce(filters, (collector: any, element) => {
      if (element.code === 'board') {
        collector.board = _.get(_.orderBy(element.range, ['index'], ['asc']), '[0].name') || '';
      }
      return collector;
    }, {});
    this.dataDrivenFilterEvent.emit(defaultFilters);
  }
  private getFrameWork() {
    const framework = this.cacheService.get('framework' + 'search');
    if (framework) {
      return of(framework);
    } else {
      const formServiceInputParams = {
        formType: 'framework',
        formAction: 'search',
        contentType: 'framework-code',
      };
      return this.formService.getFormConfig(formServiceInputParams, this.hashTagId)
        .pipe(map((data: ServerResponse) => {
          const frameWork = _.find(data, 'framework').framework;
          this.cacheService.set('framework' + 'search', frameWork, { maxAge: this.browserCacheTtlService.browserCacheTtl });
          return frameWork;
        }), catchError((error) => {
          return of(false);
        }));
    }
  }
  private fetchEnrolledCoursesSection() {
    return this.coursesService.enrolledCourseData$.pipe(map(({ enrolledCourses, err }) => {
      const enrolledSection = {
        name: 'My Courses',
        length: 0,
        contents: []
      };
      if (err) {
        // show toaster message this.resourceService.messages.fmsg.m0001
        return enrolledSection;
      }
      const { constantData, metaData, dynamicFields, slickSize } = this.configService.appConfig.CoursePageSection.enrolledCourses;
      enrolledSection.contents = this.utilService.getDataForCard(enrolledCourses, constantData, dynamicFields, metaData);
      this.enrolledContentList.listofenrolledcourses.next(enrolledSection.contents);
      return enrolledSection;
    }));
  }
  public prepareVisits(event) {
    _.forEach(event, (inView, index) => {
      if (inView.metaData.identifier) {
        this.inViewLogs.push({
          objid: inView.metaData.identifier,
          objtype: 'course',
          index: index,
          section: inView.section,
        });
      } else if (inView.metaData.courseId) {
        this.inViewLogs.push({
          objid: inView.metaData.courseId,
          objtype: 'course',
          index: index,
          section: inView.section,
        });
      }
    });
    this.telemetryImpression.edata.visits = this.inViewLogs;
    this.telemetryImpression.edata.subtype = 'pageexit';
    this.telemetryImpression = Object.assign({}, this.telemetryImpression);
  }
  public playContent(event) {
    if (event.data.metaData.batchId) {
      event.data.metaData.mimeType = 'application/vnd.ekstep.content-collection';
      event.data.metaData.contentType = 'Course';
    }
    this.playerService.playContent(event.data.metaData);
  }

  public bestTrainer() {
    window.open('http://52.221.207.221:3050', '_blank');

    // this.bestTrainerUrl =  this.sanitizer.bypassSecurityTrustResourceUrl('http://52.221.207.221:3050');
    // this.trainerModal = true;
  }


  public viewAll(event) {
    const searchQuery = JSON.parse(event.searchQuery);
    // searchQuery.request.filters.channel = this.hashTagId;
    // searchQuery.request.filters.board = this.prominentFilters.board;
    const searchQueryParams: any = {};
    _.forIn(searchQuery.request.filters, (value, key) => {
      if (_.isPlainObject(value)) {
        searchQueryParams.dynamic = JSON.stringify({ [key]: value });
      } else {
        searchQueryParams[key] = value;
      }
    });
    searchQueryParams.defaultSortBy = JSON.stringify(searchQuery.request.sort_by);
    searchQueryParams.exists = searchQuery.request.exists;
    this.cacheService.set('viewAllQuery', searchQueryParams, { maxAge: this.browserCacheTtlService.browserCacheTtl });
    const queryParams = { ...searchQueryParams, ...this.queryParams };
    const sectionUrl = this.router.url.split('?')[0] + '/view-all/' + event.name.replace(/\s/g, '-');
    this.router.navigate([sectionUrl, 1], { queryParams: queryParams });
  }
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
  private setTelemetryData() {
    this.telemetryImpression = {
      context: {
        env: this.activatedRoute.snapshot.data.telemetry.env
      },
      edata: {
        type: this.activatedRoute.snapshot.data.telemetry.type,
        pageid: this.activatedRoute.snapshot.data.telemetry.pageid,
        uri: this.router.url,
        subtype: this.activatedRoute.snapshot.data.telemetry.subtype
      }
    };
    this.sortIntractEdata = {
      id: 'sort',
      type: 'click',
      pageid: 'course-page'
    };
  }
  private setNoResultMessage() {
    if (this.enrolledSection.length === 0) {
      this.enrolledLoader = false;
    }
    this.noResultMessage = {
      'message': _.get(this.resourceService, 'messages.stmsg.m0007') || 'No results found',
      'messageText': _.get(this.resourceService, 'messages.stmsg.m0006') || 'Please search for something else.'
    };
  }
}

