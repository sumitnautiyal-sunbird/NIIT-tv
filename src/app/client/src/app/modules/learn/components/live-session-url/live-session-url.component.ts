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
  loaderMessage = 'Loading pdf please wait';
  path: string;
  path1: string;
  userName: string;
    sessionUrl: any;
  constructor(activated: ActivatedRoute, sanitizers: DomSanitizer,
    config: ConfigService, contentServe: ContentService , private rout: Router) {
      this.activatedRoute = activated;
      this.activatedRoute.queryParams.subscribe(url => {
          console.log('parm url', url);
        this.sessionUrl = url.sessionUrl;
      });
      this.configService = config;
      this.contentService = contentServe;
      this.sanitizer = sanitizers;
      this.showLoader = true;
      this.route = rout;

    }

  ngOnInit() {


      this.assetDetail = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.sessionUrl);
      this.showLoader = false;

  }
  navigateToDetailsPage() {
    this.activatedRoute.url.subscribe(url => {
        console.log('liove session url', url);
      this.path = url[0].path;
      this.path1 = url[2].path;
      });
        this.route.navigate(['learn/course/' + this.path + '/batch/', this.path1]);
  }

}