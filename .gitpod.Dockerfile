FROM gitpod/workspace-full

# install AWS CLI v2
RUN brew install awscli && \
  # install tree
  brew install tree && \
  # install docker
  brew install docker && \
  # install AWS CDK
  npm install -g aws-cdk && \
  # install composer
  brew install composer && \
  # install tig
  brew install tig
