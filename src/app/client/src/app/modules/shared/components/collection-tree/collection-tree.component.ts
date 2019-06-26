/*
 *
 * Author: Sunil A S<sunils@ilimi.in>
 *
 */

import {
  Component,
  OnInit,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  Output,
  EventEmitter
} from '@angular/core';
import * as _ from 'lodash';
import {
  ICollectionTreeNodes,
  ICollectionTreeOptions,
  MimeTypeTofileType,
  IactivityType
} from '../../interfaces';
import { ResourceService, ToasterService } from '../../services/index';
import { b, d } from '@angular/core/src/render3';
import { constructor } from 'lodash';
import * as moment from 'moment';
import { _localeFactory } from '@angular/core/src/application_module';

@Component({
  selector: 'app-collection-tree',
  templateUrl: './collection-tree.component.html',
  styleUrls: ['./collection-tree.component.css']
})
export class CollectionTreeComponent implements OnInit, OnChanges {
  @Input() public nodes: ICollectionTreeNodes;
  @Input() public options: ICollectionTreeOptions;
  @Input() public enrolledDate: any;
  @Input() public name: any;
  @Input() public courseId: any;
  @Input() public batchId: any;
  @Input() contentId;
  date: Date;
  @Output() public contentSelect: EventEmitter<{
    id: string;
    title: string;
  }> = new EventEmitter();
  @Input() contentStatus: any;
  @Input() enrolled: boolean;
  @Input() loggedIn: boolean;
  private rootNode: any;
  public rootChildrens: any;
  public children = [];
  public preContent = {};
  public contentsStatus = [];
  public completedUnits = [];
  public local;
  @Input() userEnrolledBatch;
openLock = false;
open: boolean;
  statuscount = 0;
  rootContents = [];
  private iconColor = {
    '0': 'fancy-tree-grey',
    '1': 'fancy-tree-blue',
    '2': 'fancy-tree-green'
  };
  units: any;
  constructor(public resourceService?: ResourceService, public toasterService?: ToasterService) {
    this.resourceService = resourceService;
  }
  ngOnInit() {
    console.log('enrolled date', this.contentId, this.enrolledDate, this.enrolled, this.loggedIn,
     this.name, this.batchId, this.courseId, this.contentsStatus);
//      this.local = localStorage.getItem('');
//    this.local  = JSON.parse(this.local);
// console.log('local storage', this.local);
    this.initialize();
  }

  ngOnChanges() {
    this.initialize();
  }

  public onNodeClick(node: any) {

    if (!node.folder) {
      this.contentSelect.emit({ id: node.id, title: node.title });
    }
  }


  public onItemSelect(item: any) {
    if (!item.folder) {
      this.contentSelect.emit({ id: item.data.id, title: item.title });
    }
  }

  private initialize() {
    console.log('contentStatus', this.userEnrolledBatch);

    this.rootNode = this.createTreeModel();
    if (this.rootNode) {
      this.rootChildrens = this.rootNode.children;
      _.forEach(this.rootChildrens, child => {
        this.rootContents.push(child);
      });
      this.addNodeMeta();


      /*
      *
      *to add prerequisites data
      *
      */
      _.forOwn(this.rootNode.model.children, children => {
        console.log('child', children);
        if (children.prerequisites) {
          children['togglePanelIcon'] = false;
         } else {
           children['togglePanelIcon'] = true;
         }
        console.log('child', children);
        this.getContent(children.identifier, children);
        this.preContent[children.identifier] = this.children;

        this.children = [];
      });
        this.getCourseStatus();
    }
  }



  private createTreeModel() {
    if (!this.nodes) {
      return;
    }
    const model = new TreeModel();
    return model.parse(this.nodes.data);
  }
  private addNodeMeta() {

    if (!this.rootNode) { return; }
    this.rootNode.walk((node) => {
      console.log('this.contentsStatus', this.contentsStatus, node);
      node.fileType = MimeTypeTofileType[node.model.mimeType];
      if (!!node.model.activityType) {
        node.activityType = IactivityType[node.model.activityType];
      }
      node.id = node.model.identifier;
      if (node.children && node.children.length) {
        if (this.enrolledDate) {
          node['startDate'] = moment(this.enrolledDate).add(node.model.activitystart, 'days').format('D MMMM YYYY');
          node['endDate'] = moment(this.enrolledDate).add( node.model.activityend, 'days').format('D MMMM YYYY');
        }
        if (this.options.folderIcon) {
          node.icon = this.options.folderIcon;
        }
        node.folder = true;
      } else {
        if (
          node.fileType ===
          MimeTypeTofileType['application/vnd.ekstep.content-collection']
        ) {
          node.folder = true;
        } else {
          const indexOf = _.findIndex(this.contentStatus, {});
          if (this.contentStatus) {
            this.local = localStorage.getItem(node.model.identifier);
            this.local  = JSON.parse(this.local);

            const content: any = _.find(this.contentStatus, {
              contentId: node.model.identifier
            });

         let status =
              content && content.status ? content.status.toString() : 0;
              if (this.local) {
                console.log('local defined');
               content.status = this.local.status;
               status = this.local.status;
              }
              this.contentsStatus.push(content);
              console.log('status color', this.local, content, this.contentStatus, status);
            node.iconColor = this.iconColor[status];
          } else {
            node.iconColor = this.iconColor['0'];
          }
          node.folder = false;
        }
        node.icon =
          this.options.customFileIcon[node.fileType] || this.options.fileIcon;
        node.icon = `${node.icon} ${node.iconColor}`;
      }
      if (node.folder && !node.children.length) {
        node.title =
          node.model.name +
          '<strong> (' +
          this.resourceService.messages.stmsg.m0121 +
          ')</strong>';
        node.extraClasses = 'disabled';
      } else {
        node.title = node.model.name || 'Untitled File';
        node.extraClasses = '';
      }
    });
  }

/* To get CourseUnit Status details starts*/

public onNode(node: any) {
  console.log(node, open, this.completedUnits);
  if (node.model.prerequisites && !node.model.open) {
    let preData = node.model.prerequisites.split(',');
    console.log(preData);

    _.forEach(preData , data => {
      console.log('complted units', this.completedUnits, data);
      console.log('find', _.includes(this.completedUnits, data));
      if ( _.includes(this.completedUnits, data)) {
        _.pull(preData, data);
        console.log('fil', _.pull(preData, data)
        );
       }
    });
    this.toasterService.error('You should complete prerequisites:' + '     ' + preData);
    preData = [];
  }
  if (!node.model.prerequisites) {
    node.model.togglePanelIcon = !node.model.togglePanelIcon;
  }
  }

public getCourseStatus() {
    _.forOwn(this.rootContents, (children: any) => {
      if (children.model.prerequisites) {
        _.forOwn(this.rootContents, (contents: any) => {
          if (_.includes(children.model.prerequisites, contents.model.name)) {
            if (this.preContent.hasOwnProperty(contents.model.identifier)) {
          this.getStausOfNode(contents.model.identifier, this.preContent[contents.model.identifier]);
          if (this.open === true ) {
            if (this.completedUnits.indexOf(contents.model.name) === -1) {
              this.completedUnits.push(contents.model.name);

            }

            children.model['open'] = true;
            children.model['togglePanelIcon'] = true;
          } else {
            children.model['open'] = false;
            children.model['togglePanelIcon'] = false;
          }
            }
          }
        });
      }
    });
  }
 public getStausOfNode(id, children: any) {
      let statusofcontent = 0;
      const totalContent = 2 * children.length;
      _.forEach(children, pre => {
       if (_.find(this.contentsStatus, {'contentId': pre })) {
            const obj = _.find(this.contentsStatus, {'contentId': pre } );
            if (obj.status === 2) {
                statusofcontent = statusofcontent + obj.status;
            }
       }
      });
      if (statusofcontent === totalContent) {
        console.log('tr', id);
         this.open = true;
         console.log('this.open', this.open);
      } else {
        this.open = false;
      }
    }
 public getContent(rootId, children) {
      console.log(this.contentsStatus);
      _.forOwn(children.children, child => {
        if (child.hasOwnProperty('children') && child.children.length > 0) {
          this.getContent(rootId, child);
        } else {
          this.children.push(child.identifier);
        }
      });
      }
      /* To get CourseUnit Status details ends*/
}
