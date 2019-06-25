
import {
  Component,
  AfterViewInit,
  Input,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import 'jquery.fancytree';
import { IFancytreeOptions } from '../../interfaces';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Router, ActivatedRoute } from '@angular/router';
import { nodeChildrenAsMap } from '@angular/router/src/utils/tree';
import { FormGroup, FormControl, NgForm } from '@angular/forms';
import { LivesessionService, ToasterService } from '../../services';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

declare var jQuery: any;

@Component({
  selector: 'app-fancy-tree',
  templateUrl: './fancy-tree.component.html',
  styleUrls: ['./fancy-tree.component.scss']
})

export class FancyTreeComponent implements AfterViewInit, OnInit {
  @ViewChild('fancyTree') public tree: ElementRef;
  @Input() public nodes: any;
  @Input() enrolledDate: any;
  @Input() isLoggedIn: boolean;
  @Input() isEnrolled: boolean;
  // @Input() public courseId: any;
  // @Input() public batchId: any;
  @Input() userName: any;
  @Input() public options: IFancytreeOptions;
  @Input() rootNode: any;
  @Output() public itemSelect: EventEmitter<
    Fancytree.FancytreeNode
  > = new EventEmitter();
  date: Date;
  public openModal = false;
  liveSessionUrl: FormControl;
  startTime: FormControl;
  endTime: FormControl;
  courseId;
  batchId;
  flashEnable: boolean;
  isFlashEnabled: any;
  public sessionDetails = {};
  contentDetails;
  @Input() userEnrolledBatch;
  contentTitle;
  currentNode; sessionUrl: any;
  url: any;
  liveUrl: any;
  participantName: any;
  public currentDate = new Date;
  public sessionExpired = false;
  public recordedSessionUrl;
  constructor(public liveSessionService: LivesessionService, public router: Router,
    public activatedRoute: ActivatedRoute,
    public toasterService: ToasterService
  ) {
  }
  ngOnInit() {
    // $("#date").val( moment().format('MMM D, YYYY') );
    //  // set a currentDate
    //  this.currentDate = moment().format('MMM D, YYYY');
    console.log('current Date', this.currentDate);
    this.activatedRoute.params.subscribe((params) => {
      this.courseId = params.courseId;
      this.batchId = params.batchId;
    });
    console.log('content details', this.nodes);
    _.forEach(this.nodes, topic => {

      topic['expanded'] = true;
      if (this.enrolledDate) {
        topic.startDate = this.addDate(topic.model.activitystart);
        topic.endDate = this.addDate(topic.model.activityend);
        topic.title = topic.title + '<span class="date">' + topic.startDate + ' - ' + topic.endDate + '</span>';

        _.forEach(topic.children, child => {
          if (child.children.length) {
            child['startDate'] = this.addDate(child.model.activitystart);
            child['endDate'] = this.addDate(child.model.activityend);
            child['title'] = child.title + '<span class="date">' + child.startDate + '-' + child.endDate + '</span>';
          }
        });
      }
    });
    this.getSessionDetails();
    this.getFlashDetails();
  }

  addDate(day) {
    return moment(this.enrolledDate).add(day, 'days').format('D MMMM YYYY');
  }
  ngAfterViewInit() {
    let flag = true;
    let options: IFancytreeOptions = {
      extensions: ['glyph'],
      clickFolderMode: 3,
      source: this.nodes,
      glyph: {
        preset: 'awesome4',
        map: {
          folder: 'fa fa-folder-o fa-lg',
          folderOpen: 'fa fa-folder-open-o fa-lg'
        }
      },
      renderNode: (event, data) => {
        // Optionally tweak data.node.span
        console.log('data in famcy tree', data);
        if (flag) {
          if (data.node.data.activityType) {
            $(data.node.span).append(
              '<span class=\'activitytypeicon fas fa-' +
              data.node.data.activityType +
              '\'></span>'
            );
          }
        }
      },
      click: (event, data): boolean => {
        flag = false;
        console.log(data);
        const node = data.node;
        this.currentNode = node;
        this.contentTitle = node.title;
        if (data.node.data.activityType !== 'headset') {
          this.itemSelect.emit(node);
          return true;
        } else {
          this.getContentDetails(node.data.id);
        }
      }
    };
    options = { ...options, ...this.options };
    $(this.tree.nativeElement).fancytree(options);
    if (this.options.showConnectors) {
      $('.fancytree-container').addClass('fancytree-connectors');
    }
  }

  getSessionDetails() {
    console.log('session details function is called');
    this.liveSessionService.getSessionDetails().subscribe(contents => {
      // _.forOwn(contents, (content: any) => {
        _.forOwn(contents['sessionDetail'], (sessions: any) => {
          if (sessions.contentDetails.length > 0) {
            _.forOwn(sessions.contentDetails, (session: any) => {
              console.log(session);
              this.sessionDetails[session.contentId] = session;
            });
          }
        });
      });
    // });
    // console.log(this.sessionDetails);
  }
  getContentDetails(contentId) {

    if (this.sessionDetails.hasOwnProperty(contentId) && this.userEnrolledBatch) {
      this.openModal = true;
      this.contentDetails = this.sessionDetails[contentId];
    } else {
      this.openModal = false;
      if (!this.userEnrolledBatch) {
        this.toasterService.error('Sorry you should enroll to this course to be a part of this live sessions');
      } else {
        this.toasterService.error('Sorry this content does not have any Live Session');
      }
    }
    const sessionData = {'startDate': this.contentDetails.startDate, 'endTime': this.contentDetails.endTime };

    this.sessionExpired = this.isSessionExpired(sessionData);
    }

    isSessionExpired(sessionExpiration) {
      const liveSessionDate = sessionExpiration.startDate;
      if (liveSessionDate) {
        const endTime = sessionExpiration.endTime;
        if (endTime) {
          const newDate = new Date(liveSessionDate);
          newDate.setHours(endTime.split(':')[0], endTime.split(':')[1]);
          // compare the dates
          return (new Date().getTime() - newDate.getTime() ) > 0 ? true : false;
        }
      }
    }

  getFlashDetails() {
    this.isFlashEnabled = this.checkFlashEnable();
    console.log('check', this.isFlashEnabled);
    if (this.isFlashEnabled) {
      this.flashEnable = true;
      console.log('this.flashEnable', this.flashEnable);
    } else {
      //
      this.flashEnable = false;
      console.log('this.flashEnable', this.flashEnable);
    }
  }
  checkFlashEnable() {
    let hasFlash = false;
    try {
      const flash =
        navigator.mimeTypes &&
          navigator.mimeTypes['application/x-shockwave-flash']
          ? navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin
          : 0;
      if (flash) { hasFlash = true; }
    } catch (e) {
      if (navigator.mimeTypes['application/x-shockwave-flash'] !== undefined) {
        hasFlash = true;
      }
    }

    return hasFlash;
  }
  gotoLiveSession(openModal) {
    jQuery(document).ready(() => {
      jQuery('button').click(() => {
        jQuery('#Mymodal').remove();
      });
    });
    jQuery('#Mymodal').modal('close');
    this.url = this.contentDetails.livesessionurl;
    this.recordedSessionUrl = this.contentDetails.recordedSessionUrl;
    this.sessionUrl = this.url.split('&');
    this.participantName = '?guestName=' + this.userName;
    this.liveUrl = this.sessionUrl[0] + this.participantName;
    console.log('session url', this.liveUrl);
    if (this.sessionExpired) {
      if (this.isLoggedIn && this.isEnrolled) {
        this.router.navigate(['/learn/course/' + this.courseId + '/batch/' + this.batchId + '/live-session'],
          { queryParams: { sessionUrl: this.recordedSessionUrl , status: 'recorded'} }
        );
      }
    } else {
      if (this.isLoggedIn && this.isEnrolled && this.flashEnable) {
        const start = new Date(this.contentDetails.startDate);
        let starthours;
        let startmin;
        let endhours;
        let endmin;
        if (this.contentDetails.startTime && this.contentDetails.endTime) {
         starthours = this.contentDetails.startTime.split(':')[0];
         startmin = this.contentDetails.startTime.split(':')[1];
         endhours = this.contentDetails.endTime.split(':')[0];
         endmin = this.contentDetails.endTime.split(':')[1];
        }
        const starttime = start.setHours(starthours, startmin);
        const endtime = start.setHours(endhours, endmin);
        const now = new Date().getTime();
        if ( (starttime < now) && (now < endtime) ) {
          this.router.navigate( ['/learn/course/' + this.courseId + '/batch/' + this.batchId + '/live-session'],
          { queryParams: { sessionUrl: this.liveUrl, status: 'live' } }
        );
        } else {
        this.toasterService.error('session is not yet started');
        }
      } else {
        this.toasterService.error('please enable the flash on your browser');
      }
    }
  }
}
