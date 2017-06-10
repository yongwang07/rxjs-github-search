const SEARCH_REPOS = 'https://api.github.com/search/repositories?sort=stars&order=desc&q=';
const TOKEN = '2bee368c8ad1326b8c28fd9818b1cb5d4e34eadf';
const KB2MB = 0.0009765625;
const KB2BYTES = 1024;

const formatRepoSize = repoSize => parseInt(repoSize).toFixed(2);

const formatRepoSizeAndUnit = repoSize => {
  if (repoSize < 1) {
    return [formatRepoSize(repoSize * KB2BYTES), 'Bytes'];
  }
  if (repoSize >= 1 / KB2MB) {
    return [formatRepoSize(repoSize * KB2MB), 'MB'];
  }
  return [repoSize, 'KB'];
};

const reposTemplate = repos => {
  const {owner} = repos;
  return `<div class="repos_item">
    <div class="repos_item_wrapper">
      <div class="repos_user_container">
        <div class="user_header_container">
          <img data-api="${owner.url}" class="user_header" src="${owner.avatar_url}"/>
          <div class="user_infos_container">
            <div class="user_infos_wrapper">
              <div class="info_loading">
                <i aria-hidden="true" class="fa fa-spinner fa-spin"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="user_info">
          <a class="user_link" target="_blank" href="${owner.html_url}">
            ${owner.login}
          </a> /
          <a class="repos_link" target="_blank" href="${repos.html_url}">
            ${repos.name}
          </a>
        </div>
      </div>
      <div class="repos_info_container">
        <div class="repos_desc">
          ${repos.description}
        </div>
        <div class="repos_info">
          <em class="repos_language">${repos.language || ''}</em>
          <i aria-hidden="true" class="fa fa-star"></i>&nbsp;${repos.stargazers_count}&nbsp;&nbsp;
          <i aria-hidden="true" class="fa fa-eye"></i>&nbsp;${repos.watchers_count}&nbsp;&nbsp;
          <i aria-hidden="true" class="fa fa-code-fork"></i>&nbsp;${repos.forks_count}&nbsp;&nbsp;
          <i aria-hidden="true" class="fa fa-file-archive-o"></i>&nbsp;${formatRepoSizeAndUnit(repos.size).join(' ')}
        </div>
      </div>
    </div>
  </div>`;
};


const userTemplate = user => {
  return `<div class="infos_container">
    <div class="info_container">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-user-circle"></i>
      </div>&nbsp;&nbsp;${user.name || user.login}
    </div>
    ${user.location ? `<div class="info_container">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-map-marker"></i>
      </div>&nbsp;&nbsp;${user.location}
    </div>` : ''}
    ${user.email ? `<a class="info_container" href="mailto:${user.email}">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-envelope-o"></i>
      </div>&nbsp;&nbsp;${user.email}
    </a>` : ''}
    ${user.company ? `<div class="info_container">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-users"></i>
      </div>&nbsp;&nbsp;${user.company}
    </div>` : ''}
    ${user.blog ? `<a class="info_container" target="_blank" href="${user.blog}">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-chrome"></i>
      </div>&nbsp;&nbsp;${user.blog}
    </a>` : ''}
    ${user.bio ? `<div class="info_container info_bio">
      <div class="info_icon">
        <i aria-hidden="true" class="fa fa-quote-left"></i>
      </div>&nbsp;&nbsp;${user.bio}
    </div>` : ''}
    <div class="info_container info_social">
      <i aria-hidden="true" class="fa fa-cube"></i>&nbsp;${user.public_repos}&nbsp;&nbsp;
      <i aria-hidden="true" class="fa fa-user-plus"></i>&nbsp;${user.followers}&nbsp;&nbsp;
      <i aria-hidden="true" class="fa fa-calendar-check-o"></i>&nbsp;${user.updated_at.split('T')[0]}
    </div>
  </div>`;
};

const userInfoSteam = rep => {
  const avator = $(rep).find('.user_header');
  const api = avator.attr('data-api');
  const $avator = $('.user_header[data-api="' + api + '"]');
  let innerWrapper = null;
  return Rx.Observable.fromEvent($avator, 'mouseover')
    .debounceTime(500)  
    .takeWhile(e => {
      const $infosWrapper = $(e.target).parent().find('.user_infos_wrapper');
      return $infosWrapper.find('.infos_container').length === 0;
    })  
    .map(e => {
      innerWrapper = $(e.target).parent().find('.user_infos_wrapper');
      return $(e.target).attr('data-api');
    })    
    .filter(data => !!data)
    .switchMap(url => Rx.Observable.ajax(`${url}?access_token=${TOKEN}`))
    .pluck('response')
    .do(result => innerWrapper.html(userTemplate(result)));
};

(() => {
  const $container = document.querySelector('.content_container');
  const $input = document.querySelector('.search');
  const observable = Rx.Observable.fromEvent($input, 'keyup')
    .debounceTime(400)
    .map(() => $input.value.trim())
    .filter(text => !!text)
    .distinctUntilChanged()
    .do(() => {NProgress.start(); NProgress.set(0.4)})
    .switchMap(query => Rx.Observable.ajax(`${SEARCH_REPOS}${query}`))
    .pluck('response', 'items')
    .do(() => {NProgress.done(); $container.innerHTML=''})
    .flatMap(results => Rx.Observable.from(results))
    .map(result => reposTemplate(result))
    .do($repos => {$($container).append($repos);})
    .flatMap($repos => userInfoSteam($repos))
    .subscribe(
        repos => console.log(repos),
        err => console.log(err), 
        () => console.log('completed')
    );
})();