
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
import { nodeChildrenAsMap } from '@angular/router/src/utils/tree';
import { FormGroup, FormControl, NgForm } from '@angular/forms';
import { ToasterService, LivesessionService } from '../../services';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-fancy-tree',
  templateUrl: './fancy-tree.component.html',
  styleUrls: ['./fancy-tree.component.scss']
})
export class FancyTreeComponent implements AfterViewInit, OnInit {
  @ViewChild('fancyTree') public tree: ElementRef;
  @Input() public nodes: any;
  @Input() enrolledDate: any;
  @Input() public options: IFancytreeOptions;
  @Input() rootNode: any;
  @Output() public itemSelect: EventEmitter<
    Fancytree.FancytreeNode
  > = new EventEmitter();
  date: Date;
  public openModal =  false;
  liveSessionUrl: FormControl;
  startTime: FormControl;
  endTime: FormControl;
  courseId;
  batchId;
  public sessionDetails = {};
  contentDetails;
  @Input() userEnrolledBatch;
  contentTitle;
  currentNode;  constructor(public liveSessionService: LivesessionService,   public router: Router,
    public activatedRoute: ActivatedRoute,
    public toasterService: ToasterService
     ) {
  }
  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.courseId = params.courseId;
      this.batchId = params.batchId;
    });
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
  }

  addDate(day) {
    return moment(this.enrolledDate).add(day, 'days').format('D MMMM YYYY');
  }
  ngAfterViewInit() {
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
      renderNode:  (event, data) => {
        // Optionally tweak data.node.span
        if (data.node.data.activityType) {
          $(data.node.span).append(
            '<span class=\'activitytypeicon fas fa-' +
              data.node.data.activityType +
              '\'></span>'
          );
        }
      },
      click: (event, data): boolean => {
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
  console.log(this.sessionDetails);
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
}
}
