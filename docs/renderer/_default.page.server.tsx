export * from 'libframe-docs/_default.page.server'
import { setFrame } from 'libframe-docs/_default.page.server'
import { headings } from '../headings'
import { projectInfo } from '../utils'
import logoUrl from '../icons/telefunc.svg'
import React from 'react'
import { NavHeader, NavHeaderMobile } from './NavHeader'

setFrame({
  projectVersion: projectInfo.version,
  projectName: projectInfo.name,
  repo: projectInfo.githubRepository,
  logoUrl,
  headings,
  navHeader: <NavHeader />,
  navHeaderMobile: <NavHeaderMobile />,
})
