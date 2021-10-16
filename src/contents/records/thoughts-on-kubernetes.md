---
title: "Thoughts On Kubernetes"
viewTemplate: "record"
timeStamp: "2021-10-16T18:21:31+08:00"
---
# Thoughts On Kubernetes

Kubernetes, as much as I want to say use it only if it is necessary, I also think that it should be used everywhere especially when you run production systems.

Using Kubernetes enables you to have Infrastructure as Code, having the infrastructure defined in the code is easier for other people to understand the infrastructure. Since it is just text files describing what the infrastructure is like it can also be versioned with Version Control allowing people to easily track changes to the infrastructure. It also ease the pain when a team member managing the infrastructure leaves the team, anyone who has dealt with Kubernetes would be able to pick up where the team member has left off.

Because of the popularity of Kubernetes there exist Helm which is something like a package manager for Kubernetes, Helm provides a simple way to deploy services developed by other people that you need in your Kubernetes cluster. This reduces the need to develop and maintain a similar service that you might need.

This site and Kubernetes, I could have easily just spin up a VPS, install Nginx, and copy over my build folder everytime I need to update this site, which will be a lot simpler in the initial stage compared to setting up deployment using Kubernetes but the invested time to setup Kubernetes enables me to not have to think about the deployment later on.

Kubernetes is a tool to enhance the productivity of the team, it is not a silver bullet that fixes all problem. It is important for the people managing the infrastructure to understand the resources needed by the services that are deployed.

Kubernetes is just one of the tool available to achieve what I've just described, you may argue that Terraform, Ansible or even your own shell script can achieve Infrastructure as Code and you are right, It is up to you to evaluate which tool is the best for you.
