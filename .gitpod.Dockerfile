FROM gitpod/workspace-full

# install aws-cli v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
  unzip awscliv2.zip && \
  ./aws/install && \
  # install tree
  brew install tree && \
  # install docker
  brew install docker && \
  # install AWS CDK
  npm install -g aws-cdk && \
  # install tig
  brew install tig
