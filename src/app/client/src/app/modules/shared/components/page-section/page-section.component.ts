import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '../../services/index';
import { Component, Input, EventEmitter, Output } from '@angular/core';
import { ICaraouselData } from '../../interfaces/caraouselData';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
import * as _ from 'lodash';
import { IInteractEventObject, IInteractEventEdata, IImpressionEventInput } from '@sunbird/telemetry';

/**
 * This display a a section
 */
@Component({
  selector: 'app-page-section',
  templateUrl: './page-section.component.html',
  styleUrls: ['./page-section.component.scss']
})
export class PageSectionComponent implements OnInit {
  inviewLogs = [];
  cardIntractEdata: IInteractEventEdata;
  /**
  * section is used to render ICaraouselData value on the view
  */
  @Input() section: ICaraouselData;
  /**
  * section is used to render ICaraouselData value on the view
  */
  @Output() playEvent = new EventEmitter<any>();
  /**
  * section is used to render ICaraouselData value on the view
  */
  @Output() visits = new EventEmitter<any>();

  @Output() viewAll = new EventEmitter<any>();
  /**
  * This is slider setting
  */
  slideConfig = {
    'slidesToShow': 4,
    'slidesToScroll': 4,
    'responsive': [
      {
        'breakpoint': 2800,
        'settings': {
          'slidesToShow': 6,
          'slidesToScroll': 6
        }
      },
      {
        'breakpoint': 2200,
        'settings': {
          'slidesToShow': 5,
          'slidesToScroll': 5
        }
      },
      {
        'breakpoint': 2000,
        'settings': {
          'slidesToShow': 4,
          'slidesToScroll': 4
        }
      },
      {
        'breakpoint': 1600,
        'settings': {
          'slidesToShow': 4,
          'slidesToScroll': 4
        }
      },
      {
        'breakpoint': 1200,
        'settings': {
          'slidesToShow': 3,
          'slidesToScroll': 3
        }
      },
      {
        'breakpoint': 900,
        'settings': {
          'slidesToShow': 2.5,
          'slidesToScroll': 2
        }
      },
      {
        'breakpoint': 750,
        'settings': {
          'slidesToShow': 2,
          'slidesToScroll': 2
        }
      },
      {
        'breakpoint': 660,
        'settings': {
          'slidesToShow': 1.75,
          'slidesToScroll': 1
        }
      },
      {
        'breakpoint': 530,
        'settings': {
          'slidesToShow': 1.25,
          'slidesToScroll': 1
        }
      },
      {
        'breakpoint': 450,
        'settings': {
          'slidesToShow': 1,
          'slidesToScroll': 1
        }
      }
    ],
    infinite: false
  };
  /**The previous or next value of the button clicked
   * to generate interact telemetry data */
  btnArrow: string;
  pageid: string;
  name: any;
  parsedData: any;
  parsedDataName: any;
  constructor(public activatedRoute: ActivatedRoute, public resourceService: ResourceService) {
    this.resourceService = resourceService;
    this.resourceService.languageSelected$.subscribe(item => {
      console.log("in constructor",this.section);
      if (this.section === undefined) {
      }
      else {
        this.setHeaderWithLanguage(item);
      }
    });
  }
  playContent(event) {
    this.playEvent.emit(event);
  }
  ngOnInit() {
    console.log('sec com', this.section);
    const id = _.get(this.activatedRoute, 'snapshot.data.telemetry.env');
    this.pageid = _.get(this.activatedRoute, 'snapshot.data.telemetry.pageid');
    if (id && this.pageid) {
      this.cardIntractEdata = {
        id: 'content-card',
        type: 'click',
        pageid: this.pageid
      };
    }
    this.resourceService.languageSelected$.subscribe(item => {
      if (this.section === undefined) {
      }
      else {
        this.setHeaderWithLanguage(item);
      }    });
  }
  /**
   * get inview  Data
  */
  inview(event) {
    const visitsLength = this.inviewLogs.length;
    const visits = [];
    _.forEach(event.inview, (inview, key) => {
      const content = _.find(this.inviewLogs, (eachContent) => {
       if (inview.data.identifier) {
          return eachContent.identifier === inview.data.identifier;
        }
      });
      if (content === undefined) {
        inview.data.section = this.section.name;
        this.inviewLogs.push(inview.data);
        visits.push(inview.data);
      }
    });
    if (visits.length > 0) {
      this.visits.emit(visits);
    }
  }
  /**
   * get inviewChange
  */
  inviewChange(contentList, event) {
    const visits = [];
    const slideData = contentList;
    _.forEach(slideData, (slide, key) => {
      const content = _.find(this.inviewLogs, (eachContent) => {
        if (slide.metaData.courseId) {
          return eachContent.metaData.courseId === slide.metaData.courseId;
        } else if (slide.metaData.identifier) {
          return eachContent.metaData.identifier === slide.metaData.identifier;
        }
      });
      if (content === undefined) {
        slide.section = this.section.name;
        this.inviewLogs.push(slide);
        visits.push(slide);
      }
    });
    if (visits.length > 0) {
      this.visits.emit(visits);
    }
  }
  checkSlide(event) {
    if (event.currentSlide < event.nextSlide) {
      this.btnArrow = 'next-button';
    } else if (event.currentSlide > event.nextSlide) {
      this.btnArrow = 'prev-button';
    }
  }
  navigateToViewAll(section) {
    this.viewAll.emit(section);
  }
  setHeaderWithLanguage(item) {
    console.log("in function",this.section);
    let languageSelected: any;
    if (typeof item === 'object') {
      languageSelected = item.value;
    }
    else if (item === undefined) {
      languageSelected = "en";
    }
    else {
      languageSelected = item;
    }
    console.log(typeof this.section.display);
    if(typeof this.section.display === 'string') {
    this.parsedData = JSON.parse(this.section.display);
    this.parsedDataName = this.parsedData.name[languageSelected];
    }
  }
}
