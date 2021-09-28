---
title: "The First Post"
viewTemplate: "record"
timeStamp: "2021-09-29T02:08:43+08:00"
---
# The First Post

After a long time of procrastination and the hours spent on setting up Parcel V2 to work as a static site generator, it is finally at a satisfactory level for me to write my first post with this setup.

Why go through the trouble of using Parcel V2 as a static site generator when there are plenty of static site generator out there for me to choose from? One of the main reason was that when I first encountered Parcel V2, it showed me how simple it was for me to have a simple dev server up that watches my change, rebuild and refresh my output. just run `parcel serve [entry]` and it'll watch the files and rebuild whenever there's a write to the files, seems like a joy to write an entry and be able to get near instantaneous result.

Parcel V2 appeared to be a great foundation to build what I looked for in a static site generator with all its default plugins of preprocessor, optimizer and assets handling, was what I had in mind, it should be simple and quick. At last it was a bumpy ride to get to where it is today.

The first bump that I had was to create a `Transformer` plugin for Parcel V2 in order for it to be able to parse `.md` markdown files into HTMLs. Parcel V2 plugins are required to be node modules, which is kind of a hassle to setup. Since there was seldom need to create a local node module I ventured into the wilderness of the internet to see how other people go about managing a local node module. After sifting through all the data from the internet I've decided to go with using `npm link` which seems to achieve what I wanted.

Now that I know how to create a local module and make it a dependency of my project, everything should be smooth sailing from here. Proceeding with creating the markdown `Transformer` plugin and adding it to `.parcelrc`, the config file for Parcel that determines which plugin to run. I created a test file prototype.md to test out the plugin and executed `parcel build`, html was generated from the the markdown file and output in to the `dist` folder`. success!

Having experiencing that successful result, I decided to add a few more files at different level of the content folder and ran `parcel build contents/**/*` the output was generated with the right content but there was a problem, the output was all at the root directory of `dist`. I wanted the output to follow the folder structure they were originally in. Turns out there's a plugin that you can write to achieve that with Parcel called the `Namer` plugin which basically determines the file output's name and directory location. With that in mind and the experience from creating a previous plugin, I hastily put together a `Namer` plugin and added it to `.parcelrc` and ran `parcel build contents/**/*`, it worked the files were output to the dist folder following the original folder structure they were in.

So far so good, wanting to make sure that this can be easily startup from just the source I decided to delete the compiled lib files of both the plugins and tried to build it again, and I encountered an error, because I have added the `Namer` plugin as a plugin for all files the `Namer` plugin is now required in order to build the `Namer` plugin! FISH! so i decided to check if it was possible to pass in a config to parcel through the CLI so that when building the `Namer` plugin it doesn't try to use the `Namer` plugin.

Looking around the doc returned no result which is a little demotivating so I decided to look into the source. Looking for the CLI entry I've narrowed down to a specific file that handles the CLI input, there I've found what I was looking for an option to pass Parcel config as a CLI option. Excited, I quickly tried out the CLI option but nothing changed, I'm still getting the error.

After aimlessly trying to get it to work by repeating the same thing hoping that it was some cache issue, I decided to further dive into the code and see what is wrong. Spending hours comprehending an unfamiliar codebase I've found the cause of the CLI option not working, the part that shows that it accepts the CLI option was merely a code level document of sort, and the actual code that is to accept the CLI option for config was not implemented. Seeing that I have put in the effort already to identify the problem I made a [Pull Request](https://github.com/parcel-bundler/parcel/pull/6294) to the Parcel project and get it fixed upstream.

While waiting for the PR to be merge I found out that part of the Parcel project's CI pipeline was broken and decided to take it on myself to fix it. Spending hours understanding why the pipeline was failing, I've found that it was because of the `HOME` environment variable that was set to `/github/home` which broke `rustup` installation. A [Pull Request](https://github.com/parcel-bundler/parcel-benchmark-action/pull/37) was made while attempting to fix the issue with various hypothesis before coming to the conclusion of the `Home` environment variable being set as `/github/home`.

---

Procrastination happened

---

After a few months of hiatus from this project I decided to return to continue on this static site generator of mine. This first thing that I did after returning to the project was to change how I organized local node modules, because the current way was a little cumbersome to maintain and I found out while reading some articles on the internet that using workspaces would be simpler. While changing the local node module structure to follow workspaces I've decide to use Yarn version 2 as well as workspaces on version 1 requires setting `private: true` in packages.json.

Everything was fine until I decided to update parcel, Yarn version 2 seems to handle `peerDependency` differently from Yarn version 1, and there was some issue with some module of Parcel's that was having issues with `PeerDependency`, browsing the internet on how this should be properly handled, it is said that the change should be handled on Parcel's side. I thought of helping resolve this issue but it appears to be handled as part of release process of the module which I'm not part of, so I decided to stay away from it. Being unable to proceed with Yarn I switched over to NPM and surprise, it worked fine, parcel got updated and workspaces is working as expected.

I don't recall how I discovered it, but it turns out with the updated parcel the `Namer` plugin is no longer required, it is able to output the files according to their original file structure without a need for a customer `Namer` plugin. After verifying that the `Namer` plugin is no longer require I purged it from the project.

So the project at this stage is able to turn markdown into HTML, what it is missing is rendering the HTML content into a template. Selecting a template engine was something that was already on my mind early on in the project and I decided to go with [eta](https://eta.js.org/) reason being light weight, fast and familiarity. Selecting the template is only the first setup to integrating it to the project, there are many steps in the Parcel pipeline and I had to identify on which pipeline to integrate the template engine. Surprise! or not, after analyzing the whole Parcel pipeline I decided it is best to put it in the transformer step because that is where the css and js dependencies will be parsed and handled. With that I now have a Static site generator that is able to generate a full HTML page with template layout.

Next step is to add the ability to attach meta data to the markdown files that can be used by the `Transformer` to determine which template to use and index generation. There's a thing called Front Matter which is somewhat of a de facto standard used as adding meta data in YAML format to a file. It is populated at the top on the file. In order to parse the file for meta data another `Transformer` plugin needs to be created.

The next thing that I want for my static site generator was an index page with links to all the content. I've looked through the whole pipeline of Parcel to determine where to insert the code to create an content index generator, but decided that it is simply easier to have an external script to parse all the content and generate a JSON then feed the JSON to parcel to generate the index page. So, a JSON `Transformer` is created to handle this and the template `Transformer` was also updated to handle JSON content.

Now that all that is done, what is left is just styling the css which Parcel already have built-in support.

Which brings us to this post, summarizing my adventure of creating a static site generator using Parcel and contributing to the project while doing it. Overall I think it was a great learning experience and something to feel good about having built something from scratch.

Next time we deploy this site using Kubernetes!
