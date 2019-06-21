import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { UserService } from './../user/user.service';
import { ConfigService, ServerResponse, BrowserCacheTtlService } from '@sunbird/shared';
import { Observable, of } from 'rxjs';
import { PublicDataService } from './../public-data/public-data.service';
import { CacheService } from 'ng2-cache-service';
@Injectable()
export class FormService {
  /**
   * Reference of user service.
   */
  public userService: UserService;
  /**
   * Reference of config service
   */
  public configService: ConfigService;

  /**
   * Reference of public data service
   */
  public publicDataService: PublicDataService;

  /**
   * Default method of OrganisationService class
   *
   * @param {PublicDataService} publicDataService content service reference
   */
  constructor(userService: UserService, configService: ConfigService, publicDataService: PublicDataService,
    private cacheService: CacheService, private browserCacheTtlService: BrowserCacheTtlService) {
    this.userService = userService;
    this.configService = configService;
    this.publicDataService = publicDataService;
  }

  /**
    * @param {formType} content form type
    * @param {formAction} content form action type
    * @param {selectedContent} content selected content type
    */
  getFormConfig(formInputParams, hashTagId?: string): Observable<any> {
    console.log('inside form service', formInputParams, 'hash', hashTagId);
    const channelOptions: any = {
      url: this.configService.urlConFig.URLS.dataDrivenForms.READ,
      data: {
        request: {
          type: formInputParams.formType,
          action: formInputParams.formAction,
          subType: this.configService.appConfig.formApiTypes[formInputParams.contentType],
          rootOrgId: hashTagId ? hashTagId : this.userService.hashTagId,
          component: formInputParams.component
        }
      }
    };
    console.log(channelOptions);
    const formKey = `${channelOptions.data.request.type}${channelOptions.data.request.action}
    ${channelOptions.data.request.subType}${channelOptions.data.request.rootOrgId}`;
    const key = btoa(formKey);
    console.log(formKey);
    if (this.cacheService.get(key)) {
      const data = this.cacheService.get(key);
      console.log(data);
      return of(data);
    } else {
      if (formInputParams.framework) {
        channelOptions.data.request.framework = formInputParams.framework;
        console.log(channelOptions.data.request.framework);
      }
      console.log(channelOptions);
      return this.publicDataService.post(channelOptions).pipe(map(
        (formConfig: ServerResponse) => {
          console.log(formConfig);
          this.setForm(formKey, formConfig.result.form.data.fields);
          return formConfig.result.form.data.fields;
        }, err => {
          console.log(err);
        }));
    }
  }

  setForm(formKey, formData) {
    console.log(formKey, formData);
    const key = btoa(formKey);
    this.cacheService.set(key, formData,
      { maxAge: this.browserCacheTtlService.browserCacheTtl });
  }
}
