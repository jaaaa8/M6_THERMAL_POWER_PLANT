// ================================================================
//  Jenkins Pipeline — Frontend: React 19 + Vite
//  Deploy: Build → S3 → CloudFront Invalidation
// ================================================================

pipeline {
    agent any

    environment {
        AWS_REGION                = 'ap-northeast-1'
        S3_BUCKET                 = 'thermal-power-plant-frontend-197826770971'
        CLOUDFRONT_DISTRIBUTION_ID = 'E7LGV38B3YC6K'
        FRONTEND_DIR              = 'm6-thermal-power-plant'
    }

    tools {
        nodejs 'node20'
    }

    stages {
        // ══════════════════════════════════════════════════════════
        // STAGE 1: INSTALL DEPENDENCIES
        // ══════════════════════════════════════════════════════════
        stage('Install') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm ci'
                }
            }
        }

        // ══════════════════════════════════════════════════════════
        // STAGE 2: BUILD
        // ══════════════════════════════════════════════════════════
        stage('Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm run build'
                    sh 'ls -lh dist/'
                }
            }
        }

        // ══════════════════════════════════════════════════════════
        // STAGE 3: DEPLOY TO S3 + CLOUDFRONT
        // ══════════════════════════════════════════════════════════
        stage('Deploy to S3') {
            when {
                expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' || env.BRANCH_NAME == 'main' }
            }
            steps {
                dir("${FRONTEND_DIR}") {
                    script {
                        // Sync build output lên S3
                        sh """
                            aws s3 sync dist/ s3://${S3_BUCKET}/ \
                                --delete \
                                --region ${AWS_REGION}
                        """

                        // Invalidate CloudFront cache
                        sh """
                            aws cloudfront create-invalidation \
                                --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
                                --paths '/*'
                        """

                        echo "✅ Frontend deployed to https://d2obp1q31g34kn.cloudfront.net"
                    }
                }
            }
        }
    }

    post {
        success {
            echo '🎉 Frontend pipeline completed successfully!'
        }
        failure {
            echo '❌ Frontend pipeline failed! Check logs above.'
        }
    }
}
