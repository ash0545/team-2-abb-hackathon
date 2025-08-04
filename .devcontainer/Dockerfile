# Start from official Dev Container base for .NET 8
FROM mcr.microsoft.com/devcontainers/dotnet:8.0

# Install build dependencies
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
    make build-essential libssl-dev zlib1g-dev libbz2-dev \
    libreadline-dev libsqlite3-dev wget curl llvm \
    libncurses5-dev libncursesw5-dev xz-utils tk-dev \
    liblzma-dev tk-dev libgdbm-dev libnss3-dev libffi-dev

# Build and install Python 3.13.5 from source
RUN cd /tmp && \
    wget https://www.python.org/ftp/python/3.13.5/Python-3.13.5.tgz && \
    tar xzf Python-3.13.5.tgz && \
    cd Python-3.13.5 && \
    ./configure --prefix=/opt/python/3.13.5/ --enable-optimizations --with-lto --with-computed-gotos --with-system-ffi && \
    make -j"$(nproc)" && \
    make altinstall && \
    rm /tmp/Python-3.13.5.tgz

# Create symlinks for python3, pip, etc.
RUN ln -s /opt/python/3.13.5/bin/python3.13        /opt/python/3.13.5/bin/python3 && \
    ln -s /opt/python/3.13.5/bin/python3.13        /opt/python/3.13.5/bin/python && \
    ln -s /opt/python/3.13.5/bin/pip3.13           /opt/python/3.13.5/bin/pip3 && \
    ln -s /opt/python/3.13.5/bin/pip3.13           /opt/python/3.13.5/bin/pip && \  
    ln -s /opt/python/3.13.5/bin/pydoc3.13         /opt/python/3.13.5/bin/pydoc && \
    ln -s /opt/python/3.13.5/bin/idle3.13          /opt/python/3.13.5/bin/idle && \
    ln -s /opt/python/3.13.5/bin/python3.13-config /opt/python/3.13.5/bin/python-config && \
    /opt/python/3.13.5/bin/python3.13 -m pip install --upgrade pip setuptools wheel

# Add the new Python binaries to PATH
ENV PATH="/opt/python/3.13.5/bin:$PATH"

# Install ML dependencies globally
RUN pip install fastapi uvicorn xgboost numpy pandas scikit-learn

# Install Node.js and Angular CLI
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    node -v && npm -v && \
    npm install -g @angular/cli

# Set default shell
SHELL ["/bin/bash", "-c"]
