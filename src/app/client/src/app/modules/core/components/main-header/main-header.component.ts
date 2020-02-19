import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { UserService, PermissionService, TenantService, CoursesService, PlayerService } from './../../services';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ConfigService, ResourceService, IUserProfile, IUserData } from '@sunbird/shared';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import * as _ from 'lodash';
import { IInteractEventObject, IInteractEventEdata } from '@sunbird/telemetry';
import { CacheService } from 'ng2-cache-service';
import { FrameworkService } from './../../../core/services/framework/framework.service';
import { forEach } from '@angular/router/src/utils/collection';
import { CookieManagerService } from '../../../shared/services/cookie-manager/cookie-manager.service';
import { GetaccesstokenService } from '../../../shared/services/accesstoken/getaccesstoken.service';
import { GetkeywordsService } from '../../../shared/services/keywords/getkeywords.service';
import { map } from 'rxjs-compat/operator/map';
import { EnrolledcontentService } from '../../../shared/services/enrolledcontent/enrolledcontent.service';
import { ChildcontentdetailsService } from '../../../shared/services/childcontentdetails/childcontentdetails.service';
import { PlayresourceService } from '../../../shared/services/playresource/playresource.service';
declare var jQuery: any;
declare var SpeechSDK: any;
/**
 * Main header component
 */
@Component({
  selector: 'app-header',
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss']
})
export class MainHeaderComponent implements OnInit, OnDestroy {
  /**
   * reference of tenant service.
   */
  public tenantService: TenantService;
  /**
   * organization log
   */
  exploreButtonVisibility: string;
  logo: string;
  key: string;
  clicked: false;
  queryParam: any = {};
  showExploreHeader = false;
  showQrmodal = false;
  /*
  *to handle the workspace permissions
  */
  workSpaceRole: Array<string>;
  /**
   * tenant name
   */
  tenantName: string;
  /**
   * user profile details.
   */
  userProfile: IUserProfile;
  /**
   * Sui dropdown initiator
   */
  isOpen: boolean;
  /**
   * Admin Dashboard access roles
   */
  adminDashboard: Array<string>;
  /**
   * Announcement access roles
   */
  announcementRole: Array<string>;
  /**
   * MyActivity access roles
   */
  myActivityRole: Array<string>;
  /**
   * Organization Setup access roles
   */
  orgSetupRole: Array<string>;
  /**
   * reference of UserService service.
   */
  public userService: UserService;
  /**
   * reference of config service.
   */
  public config: ConfigService;
  /**
   * reference of resourceService service.
   */
  categoryNames = [];
  frameWorkName = '';
  termNames = [];
  terms = [];
  appLogoName;
  public resourceService: ResourceService;
  avtarMobileStyle = {
    backgroundColor: 'transparent',
    color: '#AAAAAA',
    fontFamily: 'inherit',
    fontSize: '17px',
    lineHeight: '38px',
    border: '1px solid #e8e8e8',
    borderRadius: '50%',
    height: '38px',
    width: '38px'
  };
  avtarDesktopStyle = {
    backgroundColor: 'transparent',
    color: '#AAAAAA',
    fontFamily: 'inherit',
    fontSize: '17px',
    lineHeight: '38px',
    border: '1px solid #e8e8e8',
    borderRadius: '50%',
    height: '38px',
    width: '38px'
  };
  /**
   * reference of permissionService service.
   */
  public permissionService: PermissionService;
  public signUpInteractEdata: IInteractEventEdata;
  public enterDialCodeInteractEdata: IInteractEventEdata;
  public telemetryInteractObject: IInteractEventObject;
  tenantDataSubscription: Subscription;
  userDataSubscription: Subscription;
  exploreRoutingUrl: string;
  pageId: string;
  appLogoUrl: string;
  tenantData: any;
  frameworkName: string;
  categoryName: string;
  subscriptionKey = '9cc89795996a4ece9c06aeab0da166fe';
  serviceRegion = 'westus';
  token = '';
  assistantRoutes = ['show all my courses.', 'show my registered courses.', 'show my enrolled courses.', 'my registered courses.',
    'my enrolled courses.', 'my courses.', 'enrolled courses.'];
  fullSpeech: string;
  openSpeakModal = false;
  enrolledcourses: any;
  newKeywordToSearch = '';
  /*
  * constructor
  */
  constructor(config: ConfigService, resourceService: ResourceService, public router: Router,
    permissionService: PermissionService, userService: UserService, tenantService: TenantService,
    public activatedRoute: ActivatedRoute, private cacheService: CacheService,
    private frameworkService: FrameworkService, private cookieSrvc: CookieManagerService, private getaccessToken: GetaccesstokenService,
    public keywords: GetkeywordsService, public courseService: CoursesService, public enrolledContentList: EnrolledcontentService,
    public playerService: PlayerService, public childContentDetails: ChildcontentdetailsService,
    public playResource: PlayresourceService) {
    this.config = config;
    this.resourceService = resourceService;
    this.permissionService = permissionService;
    this.userService = userService;
    this.tenantService = tenantService;
    this.workSpaceRole = this.config.rolesConfig.headerDropdownRoles.workSpaceRole;
  }

  ngOnInit() {
    this.tenantData = this.cookieSrvc.getCookie('theming');

    if (this.tenantData.length > 0) {
      this.frameworkName = JSON.parse(this.tenantData)['framework'];
      console.log('new framework name according to the tenant data is  ', this.frameworkName);
      this.categoryName = JSON.parse(this.tenantData)['tenantPreferenceDetails']['Home']['popularCatCode']['code'][0];
      console.log('new category name according to the tenant data is  ', this.categoryName);
    }
    const cookie = this.cookieSrvc.getCookieKey('theming', 'orgName');
    this.appLogoName = cookie ? cookie : 'niit_default';
    this.appLogoUrl = '../../../../../assets/logo/' + this.appLogoName + '.png';
    this.terms = [];
    this.getFrameworkCategoryandterms(this.frameworkName);

    jQuery(() => {
      jQuery('.carousel').carousel();
      jQuery('.ui.dropdown').dropdown();
    });
    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        this.terms = [];
        this.getFrameworkCategoryandterms(this.frameworkName);
        let currentRoute = this.activatedRoute.root;
        if (currentRoute.children) {
          while (currentRoute.children.length > 0) {
            const child: ActivatedRoute[] = currentRoute.children;
            child.forEach(route => {
              currentRoute = route;
              // console.log('here is  the  current route', currentRoute.data['value']['orgdata']['defaultFramework']);
              if (route.snapshot.data.telemetry) {
                if (route.snapshot.data.telemetry.pageid) {
                  this.pageId = route.snapshot.data.telemetry.pageid;
                } else {
                  this.pageId = route.snapshot.data.telemetry.env;
                }
              }
            });
          }
        }
      });
    try {
      this.exploreButtonVisibility = (<HTMLInputElement>document.getElementById('exploreButtonVisibility')).value;
    } catch (error) {
      this.exploreButtonVisibility = 'false';
    }
    this.getUrl();
    if (!this.userService.loggedIn) {
      this.getCacheLanguage();
    }
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.queryParam = { ...queryParams };
      this.key = this.queryParam['key'];
    });
    this.adminDashboard = this.config.rolesConfig.headerDropdownRoles.adminDashboard;
    this.announcementRole = this.config.rolesConfig.headerDropdownRoles.announcementRole;
    this.myActivityRole = this.config.rolesConfig.headerDropdownRoles.myActivityRole;
    this.orgSetupRole = this.config.rolesConfig.headerDropdownRoles.orgSetupRole;
    this.tenantDataSubscription = this.tenantService.tenantData$.subscribe(
      data => {
        if (data && !data.err) {
          this.logo = data.tenantData.logo;
          this.tenantName = data.tenantData.titleName;
        }
      }
    );
    this.userDataSubscription = this.userService.userData$.subscribe(
      (user: IUserData) => {
        console.log(user);
        if (user && !user.err) {
          this.userProfile = user.userProfile;
        }
      });
    this.setInteractEventData();
    this.playResource.allowSpeak.subscribe((obj) => {
      if (obj.flag) {
        this.searchContentUsingVoice(obj.option);
      }
    });
  }

  getCacheLanguage() {
    const isCachedDataExists = this.cacheService.exists('portalLanguage');
    if (isCachedDataExists) {
      const data: any | null = this.cacheService.get('portalLanguage');
      this.resourceService.getResource(data);
    }
  }
  navigateToHome() {
    this.router.navigate(['']);
  }

  navigateToWorkspace() {
    const authroles = this.permissionService.getWorkspaceAuthRoles();
    if (authroles) {
      console.log('authroles determination is done via ', authroles);
      this.router.navigate([authroles.url]);
    }
  }
  searchContentUsingVoice(opt) {
    console.log('microphone on', SpeechSDK);
    this.getaccessToken.accesstoken(this.serviceRegion, this.subscriptionKey).subscribe((res) => {
      console.log('Response', res);
    },
      (err) => {
        console.log('Error', err.error.text);
        this.token = err.error.text;
        this.fullSpeech = '';
        this.newKeywordToSearch = '';
        const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(this.token, this.serviceRegion);
        this.startRecording(speechConfig, opt);
      });
  }
  startRecording(speechConfig, opt) {
    speechConfig.speechRecognitionLanguage = 'en-US';
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    // jQuery('.ui.modal')
    //   .modal('show');
    this.openSpeakModal = true;
    let recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    recognizer.recognizeOnceAsync((result) => {
      console.log('Result', result);
      this.fullSpeech = this.fullSpeech + result['text'];
      if (opt === 1 && (result['text'] !== undefined)) {
        // get keywords
        this.fullSpeech = (this.fullSpeech.substring(0, this.fullSpeech.length - 1)).toLowerCase();
        const tempArray = this.fullSpeech.split(' ');
        tempArray.forEach((word) => {
          if (word !== 'search' && word !== 'and' && word !== 'for' && word !== 'content' && word !== 'courses' && word !== 'show'
            && word !== 'course' && word !== 'so' && word !== 'it' && word !== 'not') {
            this.newKeywordToSearch = this.newKeywordToSearch + word + ',';
          }
        });
        this.newKeywordToSearch = this.newKeywordToSearch.slice(0, this.newKeywordToSearch.length - 1);
        this.onEnter(this.newKeywordToSearch);

      } else if (opt === 2) {
        this.routeToSearchedPage();
      }
      // jQuery('.ui.modal')
      //   .modal('hide');
      this.openSpeakModal = false;
      recognizer.close();
      recognizer = undefined;
    }, (err) => {
      console.log('Error', err);
      recognizer.close();
      recognizer = undefined;
    });
  }
  routeToSearchedPage() {
    if (this.router.url === '/learn') {
      this.enrolledcourses = this.enrolledContentList.listofenrolledcourses.value;
      if (this.enrolledcourses.length > 0) {
        this.fullSpeech = this.fullSpeech.substring(0, this.fullSpeech.length - 1).toLowerCase();
        this.enrolledcourses.every(course => {
          const temp = course['name'].toLowerCase();
          //   if (
          //     (('open ' + temp).includes(this.fullSpeech) ||
          //   ('show ' + temp).includes(this.fullSpeech) ||
          //   ('learn ' + temp).includes(this.fullSpeech)) ||
          //      (('open ' + temp) === this.fullSpeech ||
          //      ('show ' + temp) === this.fullSpeech ||
          //       ('learn ' + temp) === this.fullSpeech )) {
          //        console.log(course);
          //        course.metaData.mimeType = 'application/vnd.ekstep.content-collection';
          // course.metaData.contentType = 'Course';
          //        this.playerService.playContent(course.metaData);
          //        return false ;
          //      }
          // tslint:disable-next-line: max-line-length
          const keyword = (this.fullSpeech.includes('open') ? 'open' : (this.fullSpeech.includes('show') ? 'show' : (this.fullSpeech.includes('learn') ? 'learn' : null)));
          if (keyword) {
            const tempSpeech = this.fullSpeech.substring(keyword.length + 1 , this.fullSpeech.length);
            if (temp.includes(tempSpeech)) {
              console.log(course);
              course.metaData.mimeType = 'application/vnd.ekstep.content-collection';
              course.metaData.contentType = 'Course';
              this.playerService.playContent(course.metaData);
              return false;
            }
          }
          return true;
        });
      }
    } else {
      this.assistantRoutes.forEach((ele) => {
        if (ele === this.fullSpeech.toLowerCase()) {
          console.log('Redirect');
          this.router.navigate(['/learn']);
        }
      });
      this.childContentDetails.childrenContentDetails.subscribe((childDetails) => {
        this.fullSpeech = this.fullSpeech.toLowerCase();
        this.fullSpeech = this.fullSpeech.substring(0, this.fullSpeech.length - 1);
        childDetails.every((item) => {
          const temp = (item.title).toLowerCase();
          if ((this.fullSpeech === ('play ' + temp)) || (this.fullSpeech === ('read ' + temp)) || (this.fullSpeech === ('quiz ' + temp))) {
            console.log('trying to play', item);
            this.playResource.playresource.next({ content: item, flag: true });
            return false;
          }
          return true;
        });
      });
    }
  }
  onEnter(key) {
    console.log('key', key);
    this.key = key;
    this.queryParam = {};
    this.queryParam['key'] = this.key;
    if (this.key && this.key.length > 0) {
      this.queryParam['key'] = this.key;
    } else {
      delete this.queryParam['key'];
    }
    this.router.navigate(['/search/explore-course', 1], {
      queryParams: this.queryParam
    });
  }

  getUrl() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((urlAfterRedirects: NavigationEnd) => {
      // reset the dropdrown of categories on route change
      // jQuery('.ui.dropdown').dropdown('restore defaults');
      if (_.includes(urlAfterRedirects.url, '/explore')) {
        this.showExploreHeader = true;
        const url = urlAfterRedirects.url.split('?')[0].split('/');
        if (url.indexOf('explore') === 2) {
          this.exploreRoutingUrl = url[1] + '/' + url[2];
        } else {
          this.exploreRoutingUrl = url[1];
        }
      } else if (_.includes(urlAfterRedirects.url, '/explore-course')) {
        this.showExploreHeader = true;
        const url = urlAfterRedirects.url.split('?')[0].split('/');
        if (url.indexOf('explore-course') === 2) {
          this.exploreRoutingUrl = url[1] + '/' + url[2];
        } else {
          this.exploreRoutingUrl = url[1];
        }
      } else {
        this.showExploreHeader = false;
      }
    });
  }

  closeQrModalEvent(event) {
    this.showQrmodal = false;
  }
  setInteractEventData() {
    this.signUpInteractEdata = {
      id: 'signup',
      type: 'click',
      pageid: 'public'
    };
    this.telemetryInteractObject = {
      id: '',
      type: 'signup',
      ver: '1.0'
    };
    this.enterDialCodeInteractEdata = {
      id: 'click-dial-code',
      type: 'click',
      pageid: 'explore'
    };
  }

  logout() {
    // let tenantUrl = JSON.parse(localStorage.getItem('theming'))['homeUrl'];
    localStorage.setItem('logout', 'true');
    window.location.replace('/logoff');
    this.cacheService.removeAll();
  }

  ngOnDestroy() {
    if (this.tenantDataSubscription) {
      this.tenantDataSubscription.unsubscribe();
    }
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }
  showSideBar() {
    jQuery('.ui.sidebar').sidebar('setting', 'transition', 'overlay').sidebar('toggle');
  }

  getFrameworkCategoryandterms(framework) {
    // alert('called get category terms');
    this.terms = [];
    const temp = [];
    this.frameworkService.getFrameworkCategories(framework).subscribe(categoryData => {
      console.log('recieved category data in header ', categoryData.result.framework.categories);
      // pull out terms from all the categories and keep them in one arry
      this.termNames = categoryData.result.framework.categories;
      // pull out terms from all the categories
      this.termNames.forEach((category) => {
        if ((category['code'] === 'gradeLevel')
          && category.hasOwnProperty('terms')
          && category.terms.length > 0) {
          const capturedTermArray = category.terms;
          capturedTermArray.forEach(term => {
            temp.push(term.name);
          });
        }
      });
      this.terms = temp;
      console.log('list of categories picked are ', this.termNames);
      console.log('list of terms created as ', this.terms);
    });
  }

  getFramework(framework) {
    console.log('framework', framework);
    const key = { 'gradeLevel': framework };
    this.router.navigate(['/search/explore-course', 1], {
      queryParams: key
    });
  }

  signIn() {
    window.location.replace('/learn');
  }
}
