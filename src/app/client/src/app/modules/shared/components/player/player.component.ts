import { ConfigService } from './../../services';
import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import * as _ from 'lodash';
import * as $ from 'jquery';
import { PlayerConfig } from './../../interfaces';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnChanges {
  @Input() playerConfig: PlayerConfig;
  @Output() contentProgressEvent = new EventEmitter<any>();
  @ViewChild('contentIframe') contentIframe: ElementRef;
  @Output() playerOnDestroyEvent = new EventEmitter<any>();
  @Output() sceneChangeEvent = new EventEmitter<any>();

  buildNumber: string;
  constructor(public configService: ConfigService) {
    try {
      this.buildNumber = (<HTMLInputElement>document.getElementById('buildNumber')).value;
    } catch (error) {
      this.buildNumber = '1.0';
    }
  }
  /**
   * showPlayer method will be called
   */
  ngOnInit() {
    console.log('progres eveny', this.contentProgressEvent);
    this.showPlayer();
  }
  ngOnChanges() {
    this.showPlayer();
  }
  /**
   * Initializes player with given config and emits player telemetry events
   * Emits event when content starts playing and end event when content was played/read completely
   */
  showPlayer() {
    const iFrameSrc = this.configService.appConfig.PLAYER_CONFIG.baseURL + '&build_number=' + this.buildNumber;
    console.log('ifram src is -------' + iFrameSrc);
    setTimeout(() => {
      this.contentIframe.nativeElement.src = iFrameSrc;
      console.log(this.contentIframe.nativeElement.src);
      console.log('this is the above console');
      this.contentIframe.nativeElement.onload = () => {
        this.adjustPlayerHeight();
        this.contentIframe.nativeElement.contentWindow.initializePreview(this.playerConfig);
      };
    }, 0);
    this.contentIframe.nativeElement.addEventListener('renderer:telemetry:event', (event: any) => {
      this.generateContentReadEvent(event);
      this.onLoad();
    });
  }
  /**
   * Adjust player height after load
   */
  adjustPlayerHeight() {
    const playerWidth = $('#contentPlayer').width();
    if (playerWidth) {
      const height = playerWidth * (9 / 16);
      $('#contentPlayer').css('height', height + 'px');
    }
  }
  generateContentReadEvent(event: any) {
    console.log('generate content red event ', event);
    if (event.detail.telemetryData.eid && (event.detail.telemetryData.eid === 'START' ||
      event.detail.telemetryData.eid === 'END')) {
      console.log('emiting the read event ', event);
      this.contentProgressEvent.emit(event);
    } else if (event.detail.telemetryData.eid && (event.detail.telemetryData.eid === 'IMPRESSION')) {
      console.log('inside player if');
      this.emitSceneChangeEvent();
    }
  }
  emitSceneChangeEvent(timer = 0) {
    setTimeout(() => {
      const stageId = this.contentIframe.nativeElement.contentWindow.EkstepRendererAPI.getCurrentStageId();
      const eventData = { stageId };
      this.sceneChangeEvent.emit(eventData);
    }, timer); // waiting for player to load, then fetching stageId (if we dont wait stageId will be undefined)
  }
  onLoad() {
    if ($('iframe').contents().find('body').children().find('span').length > 0) {
      $('iframe').contents().find('body').children().find('span').map(element => {
        if ((<HTMLElement>$('iframe').contents().find('body').children().find('span')[element]).className === 'vjs-icon-placeholder') {
          // tslint:disable-next-line:max-line-length
         (<HTMLElement>$('iframe').contents().find('body').children().find('span')[element]).style.cssText = 'font-family:VideoJS !important';
        }
      });
      }
  }
}
