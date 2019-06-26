import { Injectable, Inject, EventEmitter } from '@angular/core';
import { Observable, of, BehaviorSubject} from 'rxjs';
import { map, take } from 'rxjs/operators';
import { TenantResolverService } from '../../../public/services/TenantResolver/tenant-resolver.service';
import { CookieManagerService } from '../cookie-manager/cookie-manager.service';
import { SharedUserService } from '../sharedUser/shared-user.service';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SharedTenantResolverService {

  public _tenantData = false;
  public tenantData$ = new BehaviorSubject<any>(this._tenantData);
  public tenantData = this.tenantData$.asObservable();
  badReload = false;

  constructor(private mockservice: TenantResolverService,
    private cookieSrvc: CookieManagerService,
    private userSrvc: SharedUserService,
    @Inject(DOCUMENT) private document: any) {
  }

  /**
   * To set the theming values into the cookies and also emit the data to all the observables
   * subscribing to tenantData$
   */
  public setTenantConfig(configData: object) {
    this._tenantData = configData['value'];
    this.cookieSrvc.setCookie('theming', JSON.stringify(configData['value']));
    this.tenantData$.next(this._tenantData);
  }

  /**
   *Updates the theme basedon the data set by setTenantConfig method
   */
  updateTheme(sendObservable: boolean = false) {
    if (!!this._tenantData) {
      const primaryColor = this._tenantData['tenantPreferenceDetails']['Home']['theme']['primaryColor'];
      const secondaryColor = this._tenantData['tenantPreferenceDetails']['Home']['theme']['secondaryColor'];
      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--secondary-color', secondaryColor);
      this.tenantData$.next(this._tenantData);
      if (sendObservable) {
        return of(true);
      }
    } else {
      console.log('did not recieve any theme');
      this.cookieSrvc.setCookie('theming', '', 0);
      // get the tenant data and then update the theme
      if (sendObservable) {
        return of(false);
      }
    }
  }

  /**
   * Generic method called in app component to initiate the tenant retrieval process
   */
  getTenantInfo(): Observable<string | boolean | any> {
    let themedata = this.cookieSrvc.getCookie('theming');
    if (!!themedata) {
      themedata = JSON.parse(themedata);
    }
    let userid;

    userid = this.isLoggedIn(userid);
    const tenantUrl = (<HTMLInputElement>document.getElementById('tenantUrl')).value;
    // check if user is logged in or not

    if (!userid) {
      // user is not logged in
      if (performance.navigation.type === 1 && !this.badReload) {
        // if the page is reloaded
        if (themedata === 'null' || !themedata)  {
          // set the reload to false so that new tenant information can be fetched
          this.badReload = true;
          return this.getTenantInfo();
        }
        return this.reloadInfo(true);

       } else if (localStorage.getItem('logout') === 'true') {
         // user visited the root page after logout
        this.reloadSameConfig('logout');
        return of(true);
      } else if (!!themedata) {
        // there is some tenant data present in the cookies
        const localStorageConfig = themedata;

        if (!!localStorageConfig && localStorageConfig['homeUrl'] !== tenantUrl) {
          // cookie data is invalid, get new one
          this.mockservice.getMockTenant().pipe(take(1))
            .subscribe(response => {
              if (response) {
                this.setTenantConfig(response);
                this.updateTheme();
              } else {
                // response was ok, but there was some error in it
                this.cookieSrvc.setCookie('theming', '', 0);
                return of(false);
              }
            }, err => {
              // any error occured while retreiving the tenant data
              console.log('did not recieve data from getMockTenant 1');
              console.log(err);
              // remove the tenant data
              this.cookieSrvc.setCookie('theming', '', 0);
                return of(false);
            });
        }
        this._tenantData = JSON.parse(this.cookieSrvc.getCookie('theming'));
        this.updateTheme();
        // this.tenantData$.next(this._tenantData);
        return of(true);
      } else {
        // console.log('actual request');
        return this.mockservice.getMockTenant().pipe(map(response => {
          if (response) {
            this.setTenantConfig(response);
            this.updateTheme();
            return true;
          } else {
            // something went wrong with the response
            this.cookieSrvc.setCookie('theming', '', 0);
            return false;
          }
        }, err => {
          // any error occured while retreiving the tenant data
          console.log('did not recieve data from getMockTenant 2');
          console.log(err);
          // remove the tenant data
          this.cookieSrvc.setCookie('theming', '', 0);
            return false;
        }));
      }
    } else {
      //  user is logged in , check for orgId of the user
      return this.userSrvc.getLoggedInOrganisation();
    }
  }

  /**
   * checks whether the user is logged in or not using the hidden variable input element
   */
  private isLoggedIn(userid: any) {
    if (<HTMLInputElement>document.getElementById('userId')) {
      userid = (<HTMLInputElement>document.getElementById('userId')).value;
    } else {
      userid = null;
    }
    return userid;
  }

  /**
   * Generic method to retrieve specific data from tenant data stored
   */
  getTenantThemeConfig(configName?: string) {
    const theme = this._tenantData;
    if (theme !== undefined) {
      if (configName && configName.length > 0) {
        return theme['tenantPreferenceDetails'][configName];
      } else {
        return theme['tenantPreferenceDetails'];
      }
    } else {
      alert('no theme config found');
    }
  }

  /**
   * Checks if the user belongs to the current tenant website
   */
  compareUser(loggedInOrgID: string) {
    // let localData = localStorage.getItem('theming');
    const localData = this.cookieSrvc.getCookie('theming');
    let localDataJSON;
    if (!!localData && localData !== 'null') {
      localDataJSON = JSON.parse(localData);

      if (localDataJSON['orgid'] === loggedInOrgID) {
        // user belongs from the same domain
        this._tenantData = localDataJSON;
        this.updateTheme();
        // this.tenantData$.next(this._tenantData);
        return of(true);
      } else {
        //  user logged in to different domain, update the theme to user specific domain
        return of(false);
      }
    } else {
      return of(false);
    }
  }

  private reloadSameConfig(logout = null) {
    // do not reload in case of post logout scenario
    this.redirectOnLogout(logout);
    this.reloadInfo();
  }

  private redirectOnLogout(logout: string | null) {
    if (logout === 'logout') {
      // redirect to the static url of the logged out organisation
      let tenant;
      localStorage.removeItem('logout');
      const uri = this.cookieSrvc.getCookieKey('theming', 'homeUrl');
      if (uri.split('/')[1]) {
        tenant = uri.split('/')[1];
        this.document.location.href = this.document.location.origin + '/' + tenant;
      } else {
        tenant = uri.split('/')[0];
        this.document.location.href = tenant;
      }
    }
  }

  private reloadInfo(sendObservable: boolean = false): any {
    this._tenantData = this.cookieSrvc.getCookie('theming') ? JSON.parse(this.cookieSrvc.getCookie('theming')) : null;
    if (sendObservable) {
      return of(this.updateTheme(sendObservable));
      // this.tenantData$.next(this._tenantData);
    }
    this.updateTheme();
  }
}
