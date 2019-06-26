import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContentService } from '@sunbird/core';
import { ConfigService } from '@sunbird/shared';
import { BadgesService } from '../../../core/services/badges/badges.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-live-session-url',
  templateUrl: './live-session-url.component.html',
  styleUrls: ['./live-session-url.component.scss']
})
export class LiveSessionUrlComponent implements OnInit {
  public activatedRoute: ActivatedRoute;
  public configService: ConfigService;
  public contentService: ContentService;
  public contentId;
  public route: Router;
  assetDetail: any;
  sanitizer: any;
  showLoader = true;
  loaderMessage = 'Loading abobe please wait';
  path: string;
  path1: string;
  userName: string;
    sessionUrl: any;
  status = false;
  sessionStatus: any;
  constructor(activated: ActivatedRoute, sanitizers: DomSanitizer,
    config: ConfigService, contentServe: ContentService , private rout: Router) {
      this.activatedRoute = activated;
      this.activatedRoute.queryParams.subscribe(url => {
        this.sessionUrl = url.sessionUrl;
        this.sessionStatus = url.status;
      });
      this.configService = config;
      this.contentService = contentServe;
      this.sanitizer = sanitizers;
      this.showLoader = true;
      this.route = rout;

    }

    getOrigin() {
      const host = (window.location.hostname === 'localhost') ? window.location.host : window.location.origin;
      console.log('host is ', host);
      return host;
    }

  ngOnInit() {
    if (this.sessionStatus === 'recorded') {
      this.status = true;
      this.assetDetail = this.sessionUrl + '&origin=' + this.getOrigin();
      this.showLoader = false;
    } else {
      this.showLoader = false;
    }
    this.assetDetail = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.sessionUrl);

  }
  navigateToDetailsPage() {
    this.activatedRoute.url.subscribe(url => {
      this.path = url[0].path;
      this.path1 = url[2].path;
      });
        this.route.navigate(['learn/course/' + this.path + '/batch/', this.path1]);
  }

}
