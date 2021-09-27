# Section 3: Prepare a project repository

# Objective

Starting from this section, we are going to modify our Laravel application one step by one step to be a production ready online service. The first thing is to create a project folder that place our Laravel source code, Dockerfile, CDK scripts and so on.

# Highlights

- We have all the well-cooked folder in Section 01 and Section 02, but from now on, we are on our way to go production.
- Create a project folder (project repository; project repo).
- Understand the folder structure planning.

# Workshop

- Step 3.1: Create a project folder
- Step 3.2: Git init
- Step 3.3: Place the init source code
- Step 3.4: Folder structure and usage

We will NOT have any the **Section 3** works in the folder `./section-03/` from now on. It's different than [Section 1](../section-01/) and [Section 2](../section-02/). It's time to build a real project and make it go production.

## Step 3.1: Create a project folder

Go to your CLI window and find a proper project base location to create your project folder.

Create a project folder. You can choose any folder naming but in this workshop, let's say your project name is `my-laravel-on-ecs`:

```
❯ pwd
/xxx/xxx/xxx/laravel-on-aws-ecs-workshops

❯ cd ..

❯ mkdir my-laravel-on-ecs

❯ tree --dirsfirst -L 1
.
├── laravel-on-aws-ecs-workshops
└── my-laravel-on-ecs

❯ cd my-laravel-on-ecs
```

## Step 3.2: Git init

Make sure you are in our project folder right now. If you are not so sure, use `pwd` to double check it.

Now, we are going to init this project folder as a git repository (repo).

```
❯ pwd
/xxx/xxx/xxx/my-laravel-on-ecs

❯ git init
Initialized empty Git repository in /xxx/xxx/xxx/my-laravel-on-ecs/.git/
```

## Step 3.3: Place the init source code

You can use any version of Laravel you preferred. In this workshop, we will use the latest TLS version.

```
❯ composer create-project --prefer-dist laravel/laravel:8.6.1 src
```

Here is the current project folder structure in your project folder:

```
❯ pwd
/xxx/xxx/xxx/my-laravel-on-ecs

❯ tree --dirsfirst -L 1
.
└── src

1 directory, 0 files
```

Let's have a git commit for current state. It will be helpful for comparison in the following sections.

```
❯ git add .

❯ git commit -m 'init src'
```

## Step 3.4: Folder structure and usage

In our upcoming sections of the workshop, the only thing you need to do is to protect your project source code in the `src` folder. We may duplicate/remove/delete/modify files and folders out of the `src` folder but under your project folder time by time.

The idea is that we will duplicate like `section-04` folder under our workshop into your project folder. After we finish the progress of Section 4, we will remove all the files and folders of Section 4, and get a clean project folder as our step 3.3 to practice next section.

The way to clean up all the files and folders except your `src` folder is:

```
# Make sure you are at project repo base folder
❯ pwd
/xxx/xxx/xxx/my-laravel-on-ecs

❯ find . ! -name 'src' ! -name '.git' -type d -maxdepth 1 -exec rm -rf {} +
❯ find . ! -name 'src' ! -name '.git' -type f -maxdepth 1 -exec rm -f {} +
```

Great! We are ready to start [Section 4](../section-04/) :)