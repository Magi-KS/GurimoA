---
title: "Implementing Continuous Deployment For This Site"
viewTemplate: "record"
timeStamp: "2021-10-10T16:53:31+08:00"
---
# Implementing Continuous Deployment For This Site

In this day and age having to type out a single line of command to deploy an app is no longer accepted by the industry, it is all about automation. Therefore in order to appear employable and relevant to the industry I've decided to implement Continuous Deployment for this site.

Continuing from the previous entry where I've setup deployment of this site using Kubernetes, this time we're gonna setup Continuous Deployment. What is Continuous Deployment you ask? it is fancy term given to not having the need for manual interaction in order deploy a software application. Why would anyone want this? honestly, I was also having the same thought but the satisfaction that you feel when you just need type `git push origin` and the site deployment is on its way is like enjoying a cool soda on a summer day.

So in order to have Continuous Deployment we need to modify the GitHub Action Workflow that was previously setup to build our container image to also perform the deployment. Currently the deployment is done by modifying the Kubernetes deployment resouce file, updating the image tag and run `kubectl apply -f .kube/gurimoa-deployment.yaml`, and as we all know that is not acceptable, we need automate away that primitive way of deployment.

The first thing that we need to do is to figure out how to dynamically change the image tag in our deployment resource YAML file based on the image tag that was generated, one of the reason that we need to have different image tag for each deployment is because Kubernetes only acts on a resource if there's any changes between what it is currently in Kubernetes and what is being applied. It turns out there there's no support out of the box to achieve what we want so we need to use `envsubst`, which takes input from STDIN and replace any reference to environment variable to the value set. with that knowledge in mind we replace the image in the file with `${DOCKER_IMAGE_NAME_WITH_TAG}` then we do this:
```bash
export DOCKER_IMAGE_NAME_WITH_TAG=image:tag
envsubst < .kube/gurimoa-deployment.yaml
```

Next is to be able to run `kubectl` on GitHub Action's runner. Lucky for us GitHub Action has a thing called GitHub Custom Action which allows us to use actions created by other people in our workflow, and there is one that suits our need to install kubectl on the runner created by the Microsoft Azure team called [setup-kubectl](https://github.com/azure/setup-kubectl). All we need to do is to add this step in our GitHub Action workflow:
```YAML
- uses: azure/setup-kubectl@v1
  name: Install kubectl
  with:
  version: 'v1.22.2' # default is latest stable
```

The output from `envsubst` outputs our desired resource config in STDOUT which `kubectl` is able to use as an input for applying changes, so we just need to pipe the STDOUT into STDIN of kubectl like so:
```bash
envsubst < .kube/gurimoa-deployment.yaml | kubectl apply -f -
```
specifying `-` after `-f` makes kubectl take the input from STDIN.

With that all implemented we are now a big brain developer that is able to perform deployment by just doing `git push origin`. Feel free to use this repository as a reference if you wish to achieve something similar.
